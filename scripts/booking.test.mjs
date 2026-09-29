import test from 'node:test';
import assert from 'node:assert/strict';
import { upcomingDates, validateRequest, timeSlots } from '../booking-utils.js';
import { handleRequest } from '../api/consultation.js';

const now = new Date('2026-09-30T10:00:00Z');
const valid = { emailList: 'No list yet', monthlyGuests: '500–999', quietDay: 'Monday', firstName: 'Test', business: 'Test Restaurant', website: 'example.com', email: 'test@example.com', phone: '+1 202 555 0100', preferredTime: '2026-10-01T09:00', preferredTimeUtc: '2026-10-01T07:00:00.000Z', timezone: 'Europe/Berlin', companyWebsite: '' };
const env = { TELEGRAM_BOT_TOKEN: 'test-token', TELEGRAM_CHAT_ID: 'test-chat' };
const request = body => new Request('https://example.com/api/consultation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
test('offers fourteen future weekdays and half-hour preferred times', () => {
  const dates = upcomingDates(now, 'Europe/Berlin');
  assert.equal(dates.length, 14); assert.equal(dates[0], '2026-10-01');
  assert.ok(dates.every(date => ![0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay())));
  assert.equal(timeSlots.length, 19); assert.equal(timeSlots.at(-1), '18:00');
});
test('date choices use the visitor day, not the server day', () => {
  assert.equal(upcomingDates(new Date('2026-10-01T01:00:00Z'), 'America/Los_Angeles')[0], '2026-10-01');
});
test('validates the timezone across daylight-saving changes', () => {
  const data = { ...valid, preferredTime: '2026-10-26T09:00', preferredTimeUtc: '2026-10-26T08:00:00.000Z' };
  assert.equal(validateRequest(data, new Date('2026-10-20T10:00:00Z')).preferredTime, data.preferredTime);
  assert.throws(() => validateRequest({ ...data, preferredTimeUtc: '2026-10-26T07:00:00Z' }, new Date('2026-10-20T10:00:00Z')), /timezone/);
});
test('rejects incomplete, forged, stale and invalid requests', () => {
  for (const patch of [{ email: 'bad' }, { phone: 'abc123' }, { timezone: 'fake-zone' }, { firstName: '' }, { quietDay: 'never' }, { companyWebsite: 'spam' }, { preferredTime: '2026-10-03T09:00' }, { preferredTime: '2026-09-29T09:00' }, { preferredTime: '2026-10-01T09:15' }, { preferredTimeUtc: '2026-10-01T08:00:00Z' }]) assert.throws(() => validateRequest({ ...valid, ...patch }, now));
});
test('readiness reveals no secrets and missing configuration fails closed', async () => {
  const get = await handleRequest(new Request('https://example.com/api/consultation'), { env: {} });
  assert.deepEqual(await get.json(), { ready: false });
  const post = await handleRequest(request(valid), { env: {}, now }); assert.equal(post.status, 503);
});
test('sends DineAgain details and timezone only after validation', async () => {
  let calls = 0;
  const send = async (url, options) => {
    calls++; assert.equal(url, 'https://api.telegram.org/bottest-token/sendMessage');
    const message = JSON.parse(options.body);
    assert.equal(message.chat_id, 'test-chat'); assert.match(message.text, /New DineAgain consultation request/); assert.match(message.text, /Europe\/Berlin/); assert.match(message.text, /07:00:00/); assert.ok(!message.parse_mode);
    return Response.json({ ok: true });
  };
  const invalid = await handleRequest(request({ ...valid, email: 'bad' }), { env, send, now });
  assert.equal(invalid.status, 400); assert.equal(calls, 0);
  const result = await handleRequest(request(valid), { env, send, now });
  assert.equal(result.status, 200); assert.deepEqual(await result.json(), { ok: true }); assert.equal(calls, 1);
});
test('Telegram failure and network errors never show success', async () => {
  for (const send of [async () => Response.json({ ok: false }), async () => Response.json({ ok: false }, { status: 500 }), async () => { throw new Error('private internal error'); }]) {
    const result = await handleRequest(request(valid), { env, send, now });
    assert.equal(result.status, 502); assert.doesNotMatch(await result.text(), /private internal/);
  }
});
test('rejects unsupported methods, non-JSON and oversized bodies', async () => {
  assert.equal((await handleRequest(new Request('https://example.com/api/consultation', { method: 'DELETE' }))).status, 405);
  assert.equal((await handleRequest(new Request('https://example.com/api/consultation', { method: 'POST', body: 'hello' }))).status, 415);
  assert.equal((await handleRequest(request({ ...valid, extra: 'x'.repeat(9000) }), { env, now })).status, 413);
});
