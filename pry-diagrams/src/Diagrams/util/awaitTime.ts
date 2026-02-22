export async function awaitTime(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
