export type ContextMenuAction = () => void | Promise<void>;

export interface ContextMenuElement {
  label: string;
  onClick: ContextMenuAction;
  submenu?: ContextMenuElement[];
  disabled?: boolean;
  danger?: boolean;
}

export interface ContextMenuOpenOptions {
  x?: number;
  y?: number;
}
