import { test, expect } from 'vitest';
import { insertSorted } from './insertSorted';

test('Insert 50 elements', () => {
  const arr: number[] = [];

  for (let i = 0; i < 500; i++) {
    insertSorted(arr, Math.round(Math.random() * 500000), (a, b) => a - b);
  }

  let success = true;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] > arr[i + 1]) {
      success = false;
    }
  }

  console.log(arr);
  expect(success).toBe(true);
});
