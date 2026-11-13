import test from 'node:test';
import assert from 'node:assert/strict';
import { redirectUrl } from './server.mjs';
test('shared page paths and query parameters survive forwarding', () => {
  assert.equal(redirectUrl('/learn/water-we-swim-in/collection?step=3'), 'https://one-people-access-culture.up.railway.app/learn/water-we-swim-in/collection?step=3');
  assert.equal(redirectUrl('/'), 'https://one-people-access-culture.up.railway.app/');
});
test('a request cannot redirect someone to an outside host', () => {
  for (const input of ['//example.org/phish?x=1', 'https://example.org/phish', '/%2f%2fexample.org']) {
    assert.equal(new URL(redirectUrl(input)).origin, 'https://one-people-access-culture.up.railway.app');
  }
});
