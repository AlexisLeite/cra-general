export function readFile(): Promise<string> {
  return new Promise<string>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*'; // Puedes restringirlo a .txt, .json, etc.
    input.style.display = 'none';

    input.addEventListener('change', (event) => {
      const file = (event.target as HTMLInputElement)!.files![0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          resolve(text);
        }
      };
      reader.readAsText(file);
    });

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
}
