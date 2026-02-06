if (typeof globalThis.Worker === 'undefined') {
  class MockWorker {
    constructor(_scriptURL: string | URL, _options?: WorkerOptions) {}

    addEventListener(
      _type: string,
      _listener: (event: { data: unknown }) => void,
    ) {}

    postMessage(_message: unknown) {}
  }

  (globalThis as unknown as { Worker: typeof MockWorker }).Worker =
    MockWorker;
}
