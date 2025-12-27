import { DKeyDownEvent } from '../elements/Events';
import { Measurer } from './Measurer';
import { Selector } from './Selector';
import { DiagramExtension } from './DiagramExtension';

export class Hotkeys extends DiagramExtension {
  private get measurer() {
    return this.diagram.getExtension(Measurer);
  }

  private get selector() {
    return this.diagram.getExtension(Selector);
  }

  init() {
    this.diagram.onEvent(DKeyDownEvent, (ev) => {
      if (!this.revertHotkey.has(ev.code)) {
        switch (ev.code) {
          case 'Space': {
            const measure = this.measurer.enabled;
            const selectInArea =
              !measure && this.selector.selectionMode === 'area';

            if (!measure) {
              this.selector.toggleSelectionMode(
                selectInArea ? 'element' : 'area',
              );
            }

            this.revertHotkey.set(ev.code, () => {
              if (measure) {
                this.measurer.toggle();
              } else {
                this.selector.toggleSelectionMode(
                  selectInArea ? 'area' : 'element',
                );
              }
            });
            break;
          }
          case 'KeyM':
            this.selector.toggleSelectionMode('element');
            break;
          case 'KeyS':
            if (!ev.ctrl) {
              this.selector.toggleSelectionMode('area');
            }
            break;
          case 'KeyR':
            this.measurer.toggle();
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

  protected revertHotkey = new Map<string, () => unknown>();
}
