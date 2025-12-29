import { DKeyDownEvent } from '../elements/Events';
import { Measurer } from './Measurer';
import { Selector } from './Selector';
import { DiagramExtension } from './DiagramExtension';
import { GridSnap } from './GridSnap';
import { NodesAligner } from './NodesAligner';
import { DistancesBalancer } from './DistancesBalancer';

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
          case 'ControlRight':
            ev.cancel();
            {
              const snaper = this.diagram.getExtension(GridSnap);
              snaper?.toggle();
              const aligner = this.diagram.getExtension(NodesAligner);
              aligner?.toggle();
              const balancer = this.diagram.getExtension(DistancesBalancer);
              balancer?.toggle();
              this.revertHotkey.set(ev.code, () => {
                snaper?.toggle();
                aligner?.toggle();
                balancer?.toggle();
              });
            }
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
