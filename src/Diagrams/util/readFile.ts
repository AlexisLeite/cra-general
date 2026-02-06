export type ReadFileResult = {
  fileName: string;
  mimeType: string;
  content: string;
};

export function readFile(options?: {
  accept?: string;
}): Promise<ReadFileResult | null> {
  return new Promise<ReadFileResult | null>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = options?.accept || '*/*';
    input.style.display = 'none';

    let settled = false;
    let focusFallbackTimer: number | null = null;

    const resolveOnce = (value: ReadFileResult | null) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(value);
    };

    const clearFocusFallback = () => {
      if (focusFallbackTimer !== null) {
        window.clearTimeout(focusFallbackTimer);
        focusFallbackTimer = null;
      }
    };

    const handleFocus = () => {
      clearFocusFallback();
      // Give the browser time to dispatch the file input `change` event first.
      focusFallbackTimer = window.setTimeout(() => {
        if (!settled && !input.files?.length) {
          resolveOnce(null);
        }
      }, 300);
    };

    const handleCancel = () => {
      resolveOnce(null);
    };

    const handleChange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolveOnce(null);
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => {
        resolveOnce(null);
      };
      reader.onload = (readEvent) => {
        const text = readEvent.target?.result;
        if (typeof text === 'string') {
          resolveOnce({
            fileName: file.name,
            mimeType: file.type || 'text/plain',
            content: text,
          });
          return;
        }

        resolveOnce(null);
      };
      reader.readAsText(file);
    };

    const cleanup = () => {
      clearFocusFallback();
      input.removeEventListener('change', handleChange);
      input.removeEventListener('cancel', handleCancel as EventListener);
      window.removeEventListener('focus', handleFocus);
      input.remove();
    };

    input.addEventListener('change', handleChange, { once: true });
    input.addEventListener('cancel', handleCancel as EventListener, {
      once: true,
    });
    window.addEventListener('focus', handleFocus, { once: true });

    document.body.appendChild(input);
    input.click();
  });
}
