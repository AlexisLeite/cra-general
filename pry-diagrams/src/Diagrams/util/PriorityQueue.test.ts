import { describe, it, expect } from 'vitest';
import { PriorityQueue } from './PriorityQueue';

type Item = {
  priority: number;
  value: string;
};

describe('PriorityQueue', () => {
  it('starts empty', () => {
    const pq = new PriorityQueue<Item>();

    expect(pq.size).toBe(0);
    expect(pq.isEmpty()).toBe(true);
    expect(pq.peek()).toBeUndefined();
  });

  it('pushes and pops a single element', () => {
    const pq = new PriorityQueue<Item>();

    pq.push({ priority: 10, value: 'a' });

    expect(pq.size).toBe(1);
    expect(pq.peek()?.value).toBe('a');

    const item = pq.pop();
    expect(item?.value).toBe('a');
    expect(pq.isEmpty()).toBe(true);
  });

  it('orders elements by ascending priority (min-heap)', () => {
    const pq = new PriorityQueue<Item>();

    pq.push({ priority: 5, value: 'low' });
    pq.push({ priority: 1, value: 'high' });
    pq.push({ priority: 3, value: 'mid' });

    expect(pq.pop()?.value).toBe('high');
    expect(pq.pop()?.value).toBe('mid');
    expect(pq.pop()?.value).toBe('low');
  });

  it('handles elements with the same priority', () => {
    const pq = new PriorityQueue<Item>();

    pq.push({ priority: 2, value: 'a' });
    pq.push({ priority: 2, value: 'b' });
    pq.push({ priority: 2, value: 'c' });

    const results = [pq.pop()?.value, pq.pop()?.value, pq.pop()?.value];

    expect(results.sort()).toEqual(['a', 'b', 'c']);
  });

  it('peek does not remove the element', () => {
    const pq = new PriorityQueue<Item>();

    pq.push({ priority: 1, value: 'x' });
    pq.push({ priority: 2, value: 'y' });

    expect(pq.peek()?.value).toBe('x');
    expect(pq.size).toBe(2);
  });

  it('pop returns undefined when empty', () => {
    const pq = new PriorityQueue<Item>();

    expect(pq.pop()).toBeUndefined();
    expect(pq.peek()).toBeUndefined();
  });

  it('maintains correct size during operations', () => {
    const pq = new PriorityQueue<Item>();

    pq.push({ priority: 3, value: 'a' });
    pq.push({ priority: 1, value: 'b' });
    pq.push({ priority: 2, value: 'c' });

    expect(pq.size).toBe(3);

    pq.pop();
    expect(pq.size).toBe(2);

    pq.pop();
    pq.pop();
    expect(pq.size).toBe(0);
  });

  it('handles many inserts and removals', () => {
    const pq = new PriorityQueue<Item>();

    for (let i = 100; i >= 0; i--) {
      pq.push({ priority: i, value: String(i) });
    }

    let last = -Infinity;
    while (!pq.isEmpty()) {
      const current = pq.pop()!;
      expect(current.priority).toBeGreaterThanOrEqual(last);
      last = current.priority;
    }
  });
});
