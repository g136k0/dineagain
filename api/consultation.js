import { validateRequest } from '../booking-utils.js';

const json = (body, status = 200, extra = {}) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...extra } });

export async function handleRequest(request, { env = process.env, send = fetch, now = new Date() } = {}) {
  const configured = Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);
  if (request.method === 'GET') return json({ ready: configured });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST' });
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Expected JSON' }, 415);
  if (Number(request.headers.get('content-length')) > 8192) return json({ error: 'Request too large' }, 413);
  let data;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 8192) return json({ error: 'Request too large' }, 413);
    data = validateRequest(JSON.parse(raw), now);
  } catch (error) { return json({ error: error instanceof SyntaxError ? 'Invalid request' : error.message }, 400); }
  if (!configured) return json({ error: 'Consultation requests are temporarily unavailable. Please try again later.' }, 503);
  const text = [
    '🟢 New DineAgain consultation request', '',
    `Name: ${data.firstName}`, `Restaurant: ${data.business}`, `Website: ${data.website}`, `Email: ${data.email}`, `Phone: ${data.phone}`, '',
    `Email list: ${data.emailList}`, `Monthly guests: ${data.monthlyGuests}`, `Quiet day: ${data.quietDay}`, '',
    `Preferred time: ${data.preferredTime}`, `Timezone: ${data.timezone}`, `UTC: ${data.preferredTimeUtc}`, '',
    'Request only — please confirm the time and meeting details with the guest.'
  ].join('\n');
  try {
    const response = await send(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10000)
    });
    const result = await response.json();
    if (!response.ok || result.ok !== true) return json({ error: 'We couldn’t deliver your request. Please try again later.' }, 502);
    return json({ ok: true });
  } catch { return json({ error: 'We couldn’t confirm delivery. Please wait before retrying to avoid a duplicate request.' }, 502); }
}
export default { fetch: request => handleRequest(request) };
