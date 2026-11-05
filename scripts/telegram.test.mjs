import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateTelegramConfig,
  buildApprovalMessage,
  parseCallbackQuery,
  buildCallbackResponse,
  handleTelegramWebhook,
} from './telegram-bot.mjs';

test('validateTelegramConfig detects missing or malformed credentials', () => {
  const empty = validateTelegramConfig({});
  assert.equal(empty.valid, false);
  assert.ok(empty.errors.some((e) => e.includes('TELEGRAM_BOT_TOKEN')));
  assert.ok(empty.errors.some((e) => e.includes('TELEGRAM_CHAT_ID')));

  const malformed = validateTelegramConfig({ token: 'invalid_token_format', chatId: '12345' });
  assert.equal(malformed.valid, false);
  assert.ok(malformed.errors.some((e) => e.includes('format is invalid')));

  const valid = validateTelegramConfig({
    token: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz123456789',
    chatId: '-1001234567890',
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.errors.length, 0);
});

test('buildApprovalMessage constructs valid caption and inline keyboard markup', () => {
  assert.throws(() => buildApprovalMessage({ title: 'Quick HIIT' }), /rowNumber is required/);

  const msg = buildApprovalMessage({
    title: 'Core Blast 15',
    template: 'quick-burn',
    durationSeconds: 45,
    totalFrames: 1350,
    rowNumber: 4,
  });

  assert.match(msg.caption, /Core Blast 15/);
  assert.match(msg.caption, /quick-burn/);
  assert.match(msg.caption, /45s \(1350 frames\)/);

  const buttons = msg.reply_markup.inline_keyboard[0];
  assert.equal(buttons.length, 2);
  assert.equal(buttons[0].text, '✅ Approve & Schedule');
  assert.equal(buttons[0].callback_data, 'approve:4');
  assert.equal(buttons[1].text, '❌ Reject');
  assert.equal(buttons[1].callback_data, 'reject:4');
});

test('parseCallbackQuery extracts approval and rejection callbacks cleanly', () => {
  // Non-callback update
  assert.equal(parseCallbackQuery({ message: { text: 'hello' } }), null);

  // Valid approve callback
  const approveUpdate = {
    callback_query: {
      id: 'cb-101',
      data: 'approve:7',
      from: { username: 'coach_kamil' },
      message: {
        message_id: 88,
        chat: { id: -100999 },
        caption: '🔥 Daily Workout Ready for Review!\nTitle: Tabata Burn\n\nReview the render and select an option below:',
      },
    },
  };

  const parsedApprove = parseCallbackQuery(approveUpdate);
  assert.equal(parsedApprove.valid, true);
  assert.equal(parsedApprove.id, 'cb-101');
  assert.equal(parsedApprove.action, 'approve');
  assert.equal(parsedApprove.rowNumber, 7);
  assert.equal(parsedApprove.from, 'coach_kamil');
  assert.equal(parsedApprove.messageId, 88);

  // Valid reject callback
  const rejectUpdate = {
    callback_query: {
      id: 'cb-102',
      data: 'reject:12',
      from: { first_name: 'Alex' },
      message: { message_id: 89, chat: { id: -100999 }, caption: 'Sample caption' },
    },
  };
  const parsedReject = parseCallbackQuery(rejectUpdate);
  assert.equal(parsedReject.valid, true);
  assert.equal(parsedReject.action, 'reject');
  assert.equal(parsedReject.rowNumber, 12);
  assert.equal(parsedReject.from, 'Alex');

  // Unknown callback data
  const invalidUpdate = {
    callback_query: {
      id: 'cb-103',
      data: 'unknown_action_xyz',
      from: { username: 'tester' },
    },
  };
  const parsedInvalid = parseCallbackQuery(invalidUpdate);
  assert.equal(parsedInvalid.valid, false);
  assert.match(parsedInvalid.error, /Unknown callback format/);
});

test('buildCallbackResponse removes inline buttons and updates caption with audit badge', () => {
  const query = {
    valid: true,
    id: 'cb-201',
    action: 'approve',
    rowNumber: 3,
    messageId: 44,
    chatId: -100111,
    from: 'approver_user',
    originalCaption: '🔥 Daily Workout Ready for Review!\nTitle: Morning Stretch\n\nReview the render below:',
  };

  const fixedTime = '2026-11-05T20:00:00.000Z';
  const res = buildCallbackResponse(query, fixedTime);

  assert.equal(res.answer.callback_query_id, 'cb-201');
  assert.match(res.answer.text, /Workout row 3 approved/);

  assert.equal(res.edit.chat_id, -100111);
  assert.equal(res.edit.message_id, 44);
  assert.match(res.edit.caption, /Decision: ✅ APPROVED/);
  assert.match(res.edit.caption, /Auditor: @approver_user/);
  assert.match(res.edit.caption, /Timestamp: 2026-11-05T20:00:00.000Z/);
  assert.deepEqual(res.edit.reply_markup.inline_keyboard, []);

  assert.equal(res.sheetStatus.status, 'approved');
  assert.equal(res.sheetStatus.rowNumber, 3);
});

test('handleTelegramWebhook invokes status change handler with transition payload', async () => {
  const recordedStatus = [];
  const update = {
    callback_query: {
      id: 'cb-301',
      data: 'reject:5',
      from: { username: 'qa_reviewer' },
      message: { message_id: 12, chat: { id: 555 }, caption: 'Review' },
    },
  };

  const outcome = await handleTelegramWebhook(update, async (change) => {
    recordedStatus.push(change);
  });

  assert.equal(outcome.status, 200);
  assert.equal(outcome.result, 'rejected');
  assert.equal(recordedStatus.length, 1);
  assert.equal(recordedStatus[0].status, 'rejected');
  assert.equal(recordedStatus[0].rowNumber, 5);
  assert.equal(recordedStatus[0].auditor, 'qa_reviewer');
});
