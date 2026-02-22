import { DKeyDownEvent } from '../elements/Events';
import { Measurer } from './Measurer';
import { Selector } from './Selector';
import { DiagramExtension } from './DiagramExtension';
import { GridSnap } from './GridSnap';
import { NodesAligner } from './NodesAligner';
import { DistancesBalancer } from './DistancesBalancer';
import type { Callback } from '../elements/Element';
import { History } from './History';

export type THotKey = Partial<{
  code: string;
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
}> & {
  cb: Callback<DKeyDownEvent>;
};

export class Hotkeys extends DiagramExtension {
  hotkeys: THotKey[] = [];

  private isEditableTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLButtonElement ||
      target.isContentEditable
    );
  }

  private shouldIgnoreHotkeys(ev: DKeyDownEvent) {
    return (
      this.isEditableTarget(ev.originalEvent.target) ||
      this.isEditableTarget(document.activeElement)
    );
  }

  private get measurer() {
    return this.diagram.getExtension(Measurer);
  }

  private get selector() {
    return this.diagram.getExtension(Selector);
  }

  private match(ev: DKeyDownEvent, hotkey: THotKey) {
    if (hotkey.ctrl !== undefined && ev.ctrl !== hotkey.ctrl) {
      return false;
    }
    if (hotkey.shift !== undefined && ev.shift !== hotkey.shift) {
      return false;
    }
    if (hotkey.alt !== undefined && ev.alt !== hotkey.alt) {
      return false;
    }
    if (hotkey.code !== undefined && ev.code !== hotkey.code) {
      return false;
    }
    return true;
  }

  init() {
    this.diagram.onEvent(DKeyDownEvent, async (ev) => {
      if (this.shouldIgnoreHotkeys(ev)) {
        return;
      }

      if (!this.revertHotkey.has(ev.code)) {
        for (const c of this.hotkeys) {
          if (this.match(ev, c)) {
            c.cb(ev);
            if (!ev.spreads) {
              return;
            }
          }
        }

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
          case 'KeyC':
            if (ev.ctrl) {
              navigator.clipboard.writeText(this.selector.copy());
            }
            break;
          case 'KeyV':
            if (ev.ctrl) {
              this.diagram.paste(await navigator.clipboard.readText());
            }
            break;
          case 'KeyM':
            this.selector.toggleSelectionMode('element');
            break;
          case 'KeyS':
            if (!ev.ctrl) {
              this.selector.toggleSelectionMode('area');
            }
            break;
          case 'KeyZ':
            if (ev.ctrl) {
              this.diagram.getExtension(History).undo();
            }
            break;
          case 'KeyY':
            if (ev.ctrl) {
              this.diagram.getExtension(History).redo();
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
          case 'Delete':
            this.diagram.getExtension(Selector).selectedNodes.forEach((c) => {
              this.diagram.delete(c);
            });
            this.diagram.getExtension(Selector).selectedEdges.forEach((c) => {
              this.diagram.disconnect(c);
            });
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

  register(hotkey: THotKey) {
    this.hotkeys.push(hotkey);
    return () => {
      this.hotkeys = this.hotkeys.filter((c) => c !== hotkey);
    };
  }

  protected revertHotkey = new Map<string, () => unknown>();
}
