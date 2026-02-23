import { resolvePathCore, type ResolvePathPayload } from './resolvePathCore';

self.onmessage = ({ data }: MessageEvent<ResolvePathPayload>) => {
  self.postMessage(resolvePathCore(data));
};
