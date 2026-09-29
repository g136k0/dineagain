import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
function render(config) {
  const links = Array.from({ length: 3 }, () => ({ href: '#consultation', setAttribute() {} }));
  const status = { textContent: 'Consultation booking opens soon. Please check back.' };
  const year = {};
  runInNewContext(source, { URL, Date, encodeURIComponent, window: { DINEAGAIN_CONFIG: config }, document: {
    querySelectorAll: () => links,
    getElementById: id => id === 'year' ? year : status
  } });
  return { links, status };
}
test('default CTAs open the built-in consultation form', () => {
  const result = render({});
  assert.ok(result.links.every(link => link.href === '#booking-dialog'));
});
test('HTTPS booking URL updates all CTAs', () => {
  assert.ok(render({ bookingUrl: 'https://example.com/book' }).links.every(link => link.href === 'https://example.com/book'));
});
test('email fallback supplies a real mailto link', () => {
  assert.match(render({ contactEmail: 'owner@example.com' }).links[0].href, /^mailto:owner@example.com\?subject=/);
});
test('unsafe links are rejected and email fallback remains available', () => {
  for (const bookingUrl of ['javascript:alert(1)', 'http://example.com', 'https://user:pass@example.com', 'bad url']) {
    assert.equal(render({ bookingUrl }).links[2].href, '#booking-dialog');
    assert.match(render({ bookingUrl, contactEmail: 'owner@example.com' }).links[0].href, /^mailto:/);
  }
});
test('malformed emails cannot inject query parameters', () => {
  assert.equal(render({ contactEmail: 'owner@example.com?bcc=other@example.com' }).links[2].href, '#booking-dialog');
});
