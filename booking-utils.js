export const choices = {
  emailList: ['No list yet', 'Fewer than 500', '500–999', '1,000–2,499', '2,500+'],
  monthlyGuests: ['Fewer than 500', '500–999', '1,000–2,499', '2,500–4,999', '5,000+'],
  quietDay: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'It varies']
};
export const timeSlots = Array.from({ length: 19 }, (_, index) => `${String(9 + Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`);
export function localParts(date, timezone) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date).map(part => [part.type, part.value]));
}
export function upcomingDates(now = new Date(), timezone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const parts = localParts(now, timezone);
  const cursor = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00Z`);
  const dates = [];
  while (dates.length < 14) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (![0, 6].includes(cursor.getUTCDay())) dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
}
export function validateRequest(body, now = new Date()) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Please check your request.');
  if (body.companyWebsite) throw new Error('Unable to accept this request.');
  const fields = { emailList: 40, monthlyGuests: 40, quietDay: 20, firstName: 100, business: 150, website: 250, email: 254, phone: 40, preferredTime: 16, timezone: 100, preferredTimeUtc: 30 };
  const data = {};
  for (const [field, max] of Object.entries(fields)) {
    const value = typeof body[field] === 'string' ? body[field].trim() : '';
    if (!value || value.length > max || /[\r\n\u0000-\u001f]/.test(value)) throw new Error('Please complete all fields with valid details.');
    data[field] = value;
  }
  for (const [field, options] of Object.entries(choices)) if (!options.includes(data[field])) throw new Error('Please check your restaurant details.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error('Please enter a valid email address.');
  if (!/^[+\d\s().-]{6,40}$/.test(data.phone) || data.phone.replace(/\D/g, '').length < 6) throw new Error('Please enter a valid telephone number.');
  try {
    const site = new URL(/^https?:\/\//i.test(data.website) ? data.website : `https://${data.website}`);
    if (!['http:', 'https:'].includes(site.protocol) || !site.hostname.includes('.') || site.username || site.password) throw new Error();
  } catch { throw new Error('Please enter a valid restaurant website.'); }
  try { new Intl.DateTimeFormat('en', { timeZone: data.timezone }); } catch { throw new Error('Please reload to detect your timezone.'); }
  const [date, time] = data.preferredTime.split('T');
  if (!upcomingDates(now, data.timezone).includes(date) || !timeSlots.includes(time)) throw new Error('Please choose a new preferred date and time.');
  const utc = new Date(data.preferredTimeUtc);
  if (!Number.isFinite(utc.getTime()) || utc <= now) throw new Error('Please choose a future time.');
  const parts = localParts(utc, data.timezone);
  if (`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}` !== data.preferredTime || utc.getUTCSeconds() !== 0) throw new Error('Your timezone and time do not match. Please choose your time again.');
  return data;
}
