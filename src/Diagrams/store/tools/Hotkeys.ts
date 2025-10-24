import type { Diagram } from '../Diagram';

export class Hotkeys {
  protected revertHotkey: (() => unknown) | null = null;

  constructor(public diagram: Diagram) {
    document.addEventListener('keydown', (ev) => {
      if (!this.revertHotkey) {
        switch (ev.code) {
          case 'Space':
            const selectionMode = this.diagram.selector.selectionModeEnabled;
            const measurer = this.diagram.measurer.enabled;

            if (selectionMode || measurer) {
              this.diagram.enableEvents();
            } else {
              this.diagram.selector.enableSelectionMode();
            }
            this.revertHotkey = () => {
              if (selectionMode) {
                this.diagram.selector.enableSelectionMode();
              } else if (measurer) {
                this.diagram.measurer.enable();
              } else {
                this.diagram.enableEvents();
              }
            };
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
        }
      }
    });
    document.addEventListener('keyup', () => {
      this.revertHotkey?.();
      this.revertHotkey = null;
    });
  }
}
