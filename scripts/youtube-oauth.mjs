#!/usr/bin/env node

/**
 * YouTube OAuth2 Token Bootstrap Helper.
 *
 * Generates the Google OAuth authorization URL with required YouTube upload scopes
 * and exchanges the resulting authorization code for long-lived refresh tokens.
 */

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
];

export function buildAuthUrl(clientId, redirectUri = 'http://localhost:3000/oauth2callback') {
  if (!clientId) {
    throw new Error('clientId is required to build authorization URL');
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: YOUTUBE_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
}

export async function exchangeCodeForTokens({ clientId, clientSecret, code, redirectUri = 'http://localhost:3000/oauth2callback' }) {
  if (!clientId || !clientSecret || !code) {
    throw new Error('clientId, clientSecret, and code are required to exchange tokens');
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Google OAuth error (${res.status}): ${errText}`);
  }

  return res.json();
}

function printHelp() {
  console.log(`
Usage:
  node scripts/youtube-oauth.mjs --auth-url --client-id <CLIENT_ID> [--redirect-uri <URI>]
  node scripts/youtube-oauth.mjs --exchange --client-id <CLIENT_ID> --client-secret <SECRET> --code <CODE> [--redirect-uri <URI>]

Scopes requested:
  - ${YOUTUBE_SCOPES.join('\n  - ')}
`);
}

async function runCli() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
  };

  const clientId = getArg('--client-id') || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = getArg('--client-secret') || process.env.GOOGLE_CLIENT_SECRET;
  const code = getArg('--code');
  const redirectUri = getArg('--redirect-uri') || 'http://localhost:3000/oauth2callback';

  if (args.includes('--auth-url')) {
    if (!clientId) {
      console.error('Error: --client-id or GOOGLE_CLIENT_ID env required');
      process.exit(1);
    }
    const url = buildAuthUrl(clientId, redirectUri);
    console.log('\nOpen this URL in your browser to authorize YouTube upload:');
    console.log(url);
    return;
  }

  if (args.includes('--exchange')) {
    if (!clientId || !clientSecret || !code) {
      console.error('Error: --client-id, --client-secret, and --code are required');
      process.exit(1);
    }
    try {
      const tokens = await exchangeCodeForTokens({ clientId, clientSecret, code, redirectUri });
      console.log('\n✅ Successfully received tokens:');
      console.log(JSON.stringify(tokens, null, 2));
    } catch (err) {
      console.error('Failed to exchange code:', err.message);
      process.exit(1);
    }
    return;
  }

  printHelp();
}

if (process.argv[1] && process.argv[1].endsWith('youtube-oauth.mjs')) {
  runCli();
}
