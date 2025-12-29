import { expect, test } from 'vitest';
import { makeAnimable } from './makeAnimable';
import { awaitTime } from './awaitTime';

class Test {
  d = 0;
  constructor() {
    makeAnimable(this, 3000, {
      d: true,
    });
  }
}

test('Animate value', async () => {
  const t = new Test();

  t.d = 100;

  await awaitTime(1500);

  expect(t.d).toBeLessThan(60);
  expect(t.d).toBeGreaterThan(40);

  await awaitTime(2000);

  expect(t.d).toBe(100);
});
