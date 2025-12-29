export async function* animateValue(
  from: number,
  to: number,
  timing = 2000,
  step = 30,
) {
  const start = Date.now();

  while (true) {
    const diff = Date.now() - start;
    const t = Math.min(diff / timing, 1);
    const value = from + (to - from) * t;

    yield value;

    if (t === 1) return;

    await new Promise((r) => setTimeout(r, step));
  }
}
