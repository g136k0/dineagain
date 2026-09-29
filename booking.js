import { upcomingDates, timeSlots } from './booking-utils.js';

const dialog = document.getElementById('booking-dialog');
const form = document.getElementById('booking-form');
const title = document.getElementById('booking-title');
const service = document.getElementById('booking-service');
const error = document.getElementById('booking-error');
const submit = document.getElementById('booking-submit');
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
let selectedDate = '';
let selectedTime = '';
let ready = false;
let sending = false;
let opener;
document.getElementById('booking-timezone').textContent = timezone.replaceAll('_', ' ');

function changeStep(step) {
  form.querySelectorAll('[data-step]').forEach(fieldset => { fieldset.hidden = Number(fieldset.dataset.step) !== step; fieldset.disabled = fieldset.hidden; });
  title.textContent = ['Tell us about your restaurant', 'Choose a time', 'Your details'][step - 1];
  document.getElementById('step-label').textContent = `Step ${step} of 3`;
  document.getElementById('step-progress').style.width = `${step / 3 * 100}%`;
  title.focus();
  dialog.scrollTop = 0;
}
function slotLabel() {
  return `${new Date(`${selectedDate}T${selectedTime}:00`).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · ${timezone.replaceAll('_', ' ')}`;
}
function selectTime(time) {
  selectedTime = time;
  document.querySelectorAll('.time-option').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.time === time)));
  const selection = document.getElementById('time-selection');
  selection.hidden = false;
  selection.textContent = `Preferred time: ${slotLabel()}`;
  document.getElementById('slot-review').textContent = slotLabel();
  document.getElementById('time-next').disabled = false;
}
function selectDate(date) {
  selectedDate = date; selectedTime = '';
  document.querySelectorAll('.date-option').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.date === date)));
  document.getElementById('time-selection').hidden = true;
  document.getElementById('time-next').disabled = true;
  document.getElementById('time-picker').hidden = false;
  document.querySelectorAll('.time-option').forEach(button => button.setAttribute('aria-pressed', 'false'));
  document.getElementById('time-heading').textContent = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
function renderDates() {
  const dates = upcomingDates(new Date(), timezone);
  if (!dates.includes(selectedDate)) {
    selectedDate = ''; selectedTime = '';
    document.getElementById('time-picker').hidden = true;
    document.getElementById('time-selection').hidden = true;
    document.getElementById('time-next').disabled = true;
  }
  const grid = document.getElementById('date-options');
  grid.replaceChildren();
  dates.forEach(date => {
    const value = new Date(`${date}T12:00:00`);
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'date-option'; button.dataset.date = date;
    button.setAttribute('aria-pressed', String(date === selectedDate));
    button.setAttribute('aria-label', value.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    ['span', 'strong', 'small'].forEach((tag, index) => {
      const item = document.createElement(tag);
      item.textContent = index === 0 ? value.toLocaleDateString(undefined, { weekday: 'short' }) : index === 1 ? String(value.getDate()) : value.toLocaleDateString(undefined, { month: 'short' });
      button.append(item);
    });
    button.addEventListener('click', () => selectDate(date)); grid.append(button);
  });
}
timeSlots.forEach(time => {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'time-option'; button.textContent = time; button.dataset.time = time; button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => selectTime(time)); document.getElementById('time-options').append(button);
});
async function checkService() {
  ready = false; submit.disabled = true;
  service.textContent = 'Checking consultation requests…'; service.hidden = false;
  try {
    const response = await fetch('/api/consultation', { signal: AbortSignal.timeout(10000), cache: 'no-store' });
    const data = await response.json(); ready = response.ok && data.ready === true;
  } catch { ready = false; }
  service.hidden = ready;
  service.textContent = ready ? '' : 'Consultation requests are temporarily unavailable. Please come back shortly; no request has been sent.';
  submit.disabled = !ready || sending;
}
document.querySelectorAll('[data-consultation]').forEach(link => {
  link.addEventListener('click', event => {
    if (link.getAttribute('href') !== '#booking-dialog') return;
    event.preventDefault(); opener = link;
    if (form.hidden) { form.hidden = false; document.getElementById('booking-success').hidden = true; form.reset(); selectedDate = ''; selectedTime = ''; changeStep(1); }
    renderDates(); dialog.showModal(); document.body.classList.add('booking-open'); title.focus();
    checkService();
  });
});
dialog.querySelector('.dialog-close').addEventListener('click', () => { if (!sending) dialog.close(); });
document.getElementById('booking-done').addEventListener('click', () => dialog.close());
dialog.addEventListener('cancel', event => { if (sending) event.preventDefault(); });
dialog.addEventListener('close', () => { document.body.classList.remove('booking-open'); opener?.focus(); });
form.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', () => {
  if (!form.reportValidity()) return;
  const step = Number(button.dataset.next);
  if (step === 3 && (!selectedDate || !selectedTime)) return;
  if (step === 2) renderDates();
  changeStep(step);
}));
form.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => { if (!sending) changeStep(Number(button.dataset.back)); }));
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (sending || !ready || !form.reportValidity()) return;
  const active = form.querySelector('[data-step]:not([hidden])');
  if (active.dataset.step !== '3') { active.querySelector('[data-next]')?.click(); return; }
  if (!upcomingDates(new Date(), timezone).includes(selectedDate) || !selectedTime) { renderDates(); changeStep(2); return; }
  const data = Object.fromEntries(Array.from(form.querySelectorAll('input[name],select[name]')).map(input => [input.name, input.value]));
  data.preferredTime = `${selectedDate}T${selectedTime}`;
  data.preferredTimeUtc = new Date(`${data.preferredTime}:00`).toISOString();
  data.timezone = timezone;
  sending = true; submit.disabled = true; submit.textContent = 'Sending…'; error.hidden = true;
  form.setAttribute('aria-busy', 'true');
  dialog.querySelector('.dialog-close').disabled = true;
  form.querySelectorAll('[data-back]').forEach(button => button.disabled = true);
  try {
    const response = await fetch('/api/consultation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), signal: AbortSignal.timeout(20000) });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error(result.error || 'We couldn’t send your request. Please try again.');
    form.hidden = true; document.getElementById('booking-success').hidden = false;
    document.querySelector('#booking-success h2').focus(); dialog.scrollTop = 0;
  } catch (failure) {
    error.hidden = false;
    error.textContent = failure.name === 'TimeoutError' ? 'The connection timed out, so we couldn’t confirm delivery. Please wait before retrying to avoid a duplicate request.' : failure.message === 'Failed to fetch' ? 'We couldn’t confirm delivery. Please check your connection before retrying.' : failure.message;
  } finally {
    sending = false; submit.disabled = !ready; submit.textContent = 'Request my consultation'; form.removeAttribute('aria-busy');
    dialog.querySelector('.dialog-close').disabled = false;
    form.querySelectorAll('[data-back]').forEach(button => button.disabled = false);
  }
});
