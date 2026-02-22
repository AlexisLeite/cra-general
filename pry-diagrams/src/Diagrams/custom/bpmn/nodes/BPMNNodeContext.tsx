import { createContext, useContext } from 'react';
import type { BPMNode } from './BPMNode';

export const BPMNodeContext = createContext<BPMNode | null>(null);

export function useBPMNode() {
  return useContext(BPMNodeContext)!;
}
