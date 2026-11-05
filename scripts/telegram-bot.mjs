#!/usr/bin/env node

/**
 * Telegram Approval Bot & Webhook Handler for Follow-Along Workout.
 *
 * Implements callback query processing for the 1-tap Approve/Reject workflow:
 * - Parses incoming callback_query events ('approve:<row>' / 'reject:<row>')
 * - Formats confirmation responses and status updates for the Google Sheet
 * - Sanitizes markup and prevents duplicate button submissions
 */

export const TELEGRAM_API_BASE = 'https://api.telegram.org';

/**
 * Validates Telegram bot configuration from environment or options object.
 */
export function validateTelegramConfig(config = {}) {
  const token = config.token || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = config.chatId || process.env.TELEGRAM_CHAT_ID;

  const errors = [];
  if (!token) {
    errors.push('TELEGRAM_BOT_TOKEN is required');
  } else if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) {
    errors.push('TELEGRAM_BOT_TOKEN format is invalid (expected <bot_id>:<secret>)');
  }

  if (!chatId) {
    errors.push('TELEGRAM_CHAT_ID is required');
  }

  return {
    valid: errors.length === 0,
    errors,
    token,
    chatId,
  };
}

/**
 * Generates an inline keyboard approval message payload for a rendered workout.
 */
export function buildApprovalMessage({ title, template, durationSeconds, totalFrames, rowNumber }) {
  if (!rowNumber) {
    throw new Error('rowNumber is required for approval message callback targeting');
  }

  const caption = [
    '🔥 Daily Workout Ready for Review!',
    `Title: ${title || 'Untitled Workout'}`,
    `Template: ${template || 'quick-burn'}`,
    `Duration: ${durationSeconds || 0}s (${totalFrames || 0} frames)`,
    '',
    'Review the render and select an option below:',
  ].join('\n');

  return {
    caption,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Approve & Schedule', callback_data: `approve:${rowNumber}` },
          { text: '❌ Reject', callback_data: `reject:${rowNumber}` },
        ],
      ],
    },
  };
}

/**
 * Parses an incoming Telegram webhook update.
 */
export function parseCallbackQuery(update) {
  if (!update || typeof update !== 'object') {
    throw new Error('Invalid update payload: expected object');
  }

  const cb = update.callback_query;
  if (!cb) {
    return null;
  }

  const data = cb.data || '';
  const match = data.match(/^(approve|reject):(\d+)$/);
  if (!match) {
    return {
      valid: false,
      id: cb.id,
      from: cb.from?.username || cb.from?.first_name || 'unknown',
      raw: data,
      error: `Unknown callback format: ${data}`,
    };
  }

  const [, action, rowStr] = match;
  return {
    valid: true,
    id: cb.id,
    action,
    rowNumber: parseInt(rowStr, 10),
    messageId: cb.message?.message_id,
    chatId: cb.message?.chat?.id,
    from: cb.from?.username || cb.from?.first_name || 'unknown',
    originalCaption: cb.message?.caption || '',
  };
}

/**
 * Builds the Telegram response actions to answer callback and update the message.
 */
export function buildCallbackResponse(parsedQuery, processedAt = new Date().toISOString()) {
  if (!parsedQuery || !parsedQuery.valid) {
    return {
      answer: {
        callback_query_id: parsedQuery?.id,
        text: '⚠️ Unrecognized command.',
        show_alert: true,
      },
      edit: null,
      sheetStatus: null,
    };
  }

  const isApproved = parsedQuery.action === 'approve';
  const status = isApproved ? 'approved' : 'rejected';
  const badge = isApproved ? '✅ APPROVED' : '❌ REJECTED';

  const answer = {
    callback_query_id: parsedQuery.id,
    text: isApproved
      ? `Workout row ${parsedQuery.rowNumber} approved and queued for posting!`
      : `Workout row ${parsedQuery.rowNumber} rejected.`,
    show_alert: false,
  };

  const updatedCaption = [
    parsedQuery.originalCaption ? parsedQuery.originalCaption.split('\n\nReview')[0] : '',
    '',
    `━━━━━━━━━━━━━━━━━━━`,
    `Decision: ${badge}`,
    `Auditor: @${parsedQuery.from}`,
    `Timestamp: ${processedAt}`,
  ].join('\n').trim();

  const edit = {
    chat_id: parsedQuery.chatId,
    message_id: parsedQuery.messageId,
    caption: updatedCaption,
    reply_markup: {
      inline_keyboard: [], // Clear buttons to prevent duplicate votes
    },
  };

  return {
    answer,
    edit,
    sheetStatus: {
      rowNumber: parsedQuery.rowNumber,
      status,
      auditor: parsedQuery.from,
      timestamp: processedAt,
    },
  };
}

/**
 * Handles an incoming webhook request body, executing the decision update.
 */
export async function handleTelegramWebhook(update, onStatusChange = null) {
  const parsed = parseCallbackQuery(update);
  if (!parsed) {
    return { status: 200, result: 'ignored_not_callback' };
  }

  const response = buildCallbackResponse(parsed);

  if (response.sheetStatus && typeof onStatusChange === 'function') {
    await onStatusChange(response.sheetStatus);
  }

  return {
    status: 200,
    result: response.sheetStatus ? response.sheetStatus.status : 'invalid',
    response,
  };
}
