import type { Diagram } from '../Diagram';
import { DKeyDownEvent } from '../elements/Events';

export class Hotkeys {
  protected revertHotkey = new Map<string, () => unknown>();

  constructor(public diagram: Diagram) {
    diagram.onEvent(DKeyDownEvent, (ev) => {
      if (!this.revertHotkey.has(ev.code)) {
        switch (ev.code) {
          case 'Space':
            const measure = this.diagram.measurer.enabled;
            const selectInArea =
              !measure && this.diagram.selector.selectionMode === 'area';

            if (!measure) {
              this.diagram.selector.toggleSelectionMode(
                selectInArea ? 'element' : 'area',
              );
            }

            this.revertHotkey.set(ev.code, () => {
              if (measure) {
                this.diagram.measurer.enable();
              } else {
                this.diagram.selector.toggleSelectionMode(
                  selectInArea ? 'area' : 'element',
                );
              }
            });
            break;
          case 'KeyM':
            this.diagram.selector.toggleSelectionMode('element');
            break;
          case 'KeyS':
            if (!ev.ctrl) {
              this.diagram.selector.toggleSelectionMode('area');
            }
            break;
          case 'KeyR':
            this.diagram.measurer.enable();
            break;
          case 'ControlLeft':
            ev.cancel();
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
