import { createContext, useContext } from 'react';
import type { EditableNode } from './EditableNode';

export const EditableNodeContext = createContext<EditableNode | null>(null);

export function useEditableNode() {
  return useContext(EditableNodeContext)!;
}
