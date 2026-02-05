import { useRef, type FC } from 'react';
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
  static readonly laneHeaderWidth = 50;
  static readonly laneHeight = 250;
  static readonly lanePadding = 25;

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
    const poolsHeight = this.pools.length * Lanes.laneHeight;
    return new Dimensions([
      this.state.box.x,
      this.state.box.y,
      this.state.box.width,
      poolsHeight + Lanes.lanePadding * 2,
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
    const laneBodyHeight = this.pools.length * Lanes.laneHeight;

    return (
      <div {...customRendererProps(this)}>
        <svg
          className="lane__svg"
          viewBox={`0 0 ${this.state.box.width} ${laneBodyHeight}`}
          preserveAspectRatio="none"
        >
          {this.pools.map((c, i) => {
            const y = i * Lanes.laneHeight;
            return (
              <g key={c.name}>
                <rect
                  className="lane__head"
                  x={0}
                  y={y}
                  width={Lanes.laneHeaderWidth}
                  height={Lanes.laneHeight}
                  onDoubleClick={() => {
                    this.edit();
                    runInAction(() => {
                      this.editionIndex = i;
                    });
                  }}
                />
                <rect
                  className="lane__content"
                  x={Lanes.laneHeaderWidth}
                  y={y}
                  width={Math.max(
                    0,
                    this.state.box.width - Lanes.laneHeaderWidth - 5,
                  )}
                  height={Lanes.laneHeight}
                />
                {(!this.editionMode || this.editionIndex !== i) && (
                  <text
                    className="lane__label"
                    x={Lanes.laneHeaderWidth / 2}
                    y={y + Lanes.laneHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(-90 ${Lanes.laneHeaderWidth / 2} ${y + Lanes.laneHeight / 2})`}
                  >
                    {c.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {this.pools.map((c, i) => {
          if (!this.editionMode || this.editionIndex !== i) {
            return null;
          }
          return (
            <input
              key={c.name}
              className="lane__labelInput"
              autoFocus
              style={{
                top: `${i * Lanes.laneHeight}px`,
                left: '0px',
                width: `${Lanes.laneHeaderWidth}px`,
                height: `${Lanes.laneHeight}px`,
              }}
              onMouseDown={(ev) => {
                ev.nativeEvent.stopImmediatePropagation();
              }}
              onKeyDownCapture={(ev) => {
                if (this.editionMode && !allowEventInEdition(ev.nativeEvent)) {
                  ev.nativeEvent.stopImmediatePropagation();
                }
              }}
              onKeyDown={(ev) => {
                if (ev.code === 'Tab') {
                  ev.preventDefault();
                  runInAction(() => {
                    const sum = ev.shiftKey ? -1 : 1;
                    this.editionIndex =
                      (this.editionIndex + sum + this.pools.length) %
                      this.pools.length;
                  });
                }
              }}
              value={c.label}
              onChange={(ev) => {
                runInAction(() => {
                  c.label = ev.target.value;
                });
              }}
              ref={(el) => {
                if (el instanceof HTMLInputElement && focused.current !== i) {
                  focused.current = i;
                  el.select();
                }
              }}
            />
          );
        })}
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
