import type { Diagram } from '../Diagram';

export class Hotkeys {
  protected revertHotkey = new Map<string, () => unknown>();

  constructor(public diagram: Diagram) {
    document.addEventListener('keydown', (ev) => {
      if (!this.revertHotkey.has(ev.code)) {
        switch (ev.code) {
          case 'Space':
            const selectionMode = this.diagram.selector.selectionModeEnabled;
            const measurer = this.diagram.measurer.enabled;

            if (selectionMode || measurer) {
              this.diagram.enableEvents();
            } else {
              this.diagram.selector.enableSelectionMode();
            }
            this.revertHotkey.set(ev.code, () => {
              if (selectionMode) {
                this.diagram.selector.enableSelectionMode();
              } else if (measurer) {
                this.diagram.measurer.enable();
              } else {
                this.diagram.enableEvents();
              }
            });
            break;
          case 'KeyM':
            this.diagram.enableEvents();
            break;
          case 'KeyS':
            if (!ev.ctrlKey) {
              this.diagram.selector.enableSelectionMode();
            }
            break;
          case 'KeyR':
            this.diagram.measurer.enable();
            break;
          case 'ControlLeft':
            ev.preventDefault();
            this.diagram.toggleSnapToGrid();
            this.revertHotkey.set(ev.code, () => {
              this.diagram.toggleSnapToGrid();
            });
            break;
        }
      }
    });
    document.addEventListener('keyup', () => {
      for (const k of this.revertHotkey.keys()) {
        this.revertHotkey.get(k)?.();
        this.revertHotkey.delete(k);
      }
    });
  }
}
