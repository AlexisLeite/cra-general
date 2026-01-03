import { Fragment, useRef, type FC } from 'react';
import { BPMNode } from '../BPMNode';
import { observer } from 'mobx-react-lite';
import { Element } from '../../../../store/elements/Element';
import { action, makeObservable, observable, runInAction } from 'mobx';
import { customRendererProps } from '../../../../components/objects/customRendererProps';
import { PiPlusCircleFill } from 'react-icons/pi';
import { Dimensions } from '../../../../store/primitives/Dimensions';
import { NodeTools } from '../../../../components/nodes/NodeTools';
import { cloneDeep } from '../../../../util/cloneDeep';
import { allowEventInEdition } from '../../../editable/EditionMode';
import { LanesResizer } from './LanesResizer';
import { AddLaneEvent } from '../../bpmnEvents';

export type TPool = {
  name: string;
  label: string;
};

export class Lanes extends BPMNode {
  constructor(parent: Element | null, state: { id: string }) {
    super(parent, { ...state, label: '', zIndex: 50 });

    makeObservable<Lanes, 'editionIndex'>(this, {
      pools: observable,
      addPool: action,
      editionIndex: observable,
    });

    this.classList.add('bpm__lanes');

    this.state.box.width = 250;

    this._gateways.clear();
  }

  get box() {
    return new Dimensions([
      this.state.box.x,
      this.state.box.y,
      this.state.box.width,
      this.pools.length * 250 + 50,
    ]);
  }

  addPool() {
    if (!this.emit(new AddLaneEvent(this)).cancelled) {
      let i = 0;
      while (this.pools.some((c) => c.name === `pool${i}`)) {
        i++;
      }

      const newPool = {
        label: `Pool ${i}`,
        name: `pool${i}`,
      };

      this.pools.push(newPool);
    }
    return this.pools.at(-1)!;
  }

  protected editionIndex = 0;
  protected previousPools: TPool[] = [];

  cancel() {
    this.editionIndex = 0;
    this.pools = this.previousPools;
    this.previousPools = [];
    super.cancel();
  }

  confirm() {
    if (super.confirm()) {
      this.editionIndex = 0;
      this.previousPools = [];
      return true;
    }
    return false;
  }

  public edit(): void {
    super.edit();
    this.previousPools = cloneDeep(this.pools);
  }

  resetPools() {
    this.pools = [];
  }

  deserialize(o: ReturnType<this['serialize']>): void {
    super.deserialize(o);
    this.pools = o.pools;
  }

  serialize() {
    return { ...super.serialize(), pools: cloneDeep(this.pools) };
  }

  pools: TPool[] = [
    {
      label: 'Default',
      name: 'default',
    },
  ];

  Render: FC = observer(() => {
    const focused = useRef(-1);

    return (
      <div {...customRendererProps(this)}>
        <div className="lane__pools">
          {this.pools.map((c, i) => (
            <Fragment key={c.name}>
              <div className="lane__head">
                <div
                  className="lane__label"
                  onDoubleClick={() => {
                    this.edit();
                    runInAction(() => {
                      this.editionIndex = i;
                    });
                  }}
                  onKeyDownCapture={(ev) => {
                    if (
                      this.editionMode &&
                      !allowEventInEdition(ev.nativeEvent)
                    ) {
                      ev.nativeEvent.stopImmediatePropagation();
                    }
                  }}
                  onKeyDown={(ev) => {
                    if (ev.code === 'Tab') {
                      ev.preventDefault();
                      runInAction(() => {
                        const sum = ev.shiftKey ? -1 : 1;
                        this.editionIndex =
                          (this.editionIndex + sum) % this.pools.length;
                      });
                    }
                  }}
                >
                  {this.editionMode && this.editionIndex === i ? (
                    <input
                      autoFocus
                      onMouseDown={(ev) => {
                        ev.nativeEvent.stopImmediatePropagation();
                      }}
                      value={c.label}
                      onChange={(ev) => {
                        runInAction(() => {
                          c.label = ev.target.value;
                        });
                      }}
                      ref={(el) => {
                        if (
                          el instanceof HTMLInputElement &&
                          focused.current !== i
                        ) {
                          focused.current = i;
                          el.select();
                        }
                      }}
                    />
                  ) : (
                    c.label
                  )}
                </div>
              </div>
              <div className="lane__content"></div>
            </Fragment>
          ))}
        </div>
        <NodeTools>
          <PiPlusCircleFill
            className="add_lane"
            onClick={() => this.addPool()}
          />
        </NodeTools>
        <LanesResizer lanes={this} />
      </div>
    );
  });
}
