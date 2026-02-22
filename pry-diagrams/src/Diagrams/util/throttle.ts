export function throtthle<T extends Array<any>>(
  fn: (...args: T) => unknown,
  ms = 50,
) {
  let pendingCall: (() => unknown) | null = null;

  let interval = -1;
  let working = false;
  const start = () => {
    if (!working) {
      working = true;
      interval = setInterval(() => {
        if (pendingCall) {
          try {
            pendingCall();
          } finally {
            pendingCall = null;
          }
        } else {
          clearInterval(interval);
          working = false;
        }
      }, ms);
    }
  };

  return (...args: T) => {
    pendingCall = () => fn(...args);
    start();
  };
}
