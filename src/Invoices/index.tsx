import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect, useState, type KeyboardEvent } from 'react';
import { TControllerState, TItem } from './types';

import './index.scss';

const periodo = '02/08/2025 - 01/09/2025';

class Controller {
  state: TControllerState = {
    hourPrice: 550,
    items: [],
    extra: [],
    tempStr: '',
    tempCost: '',
  };

  private genId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  getTotalHours() {
    return this.state.items.reduce((acc, cur) => acc + cur.cost, 0);
  }

  getTotalExtra() {
    return this.state.extra.reduce((acc, cur) => acc + cur.cost, 0);
  }

  getTotal() {
    const hours = this.getTotalHours();
    const extra = this.getTotalExtra();

    return hours * this.state.hourPrice + extra;
  }

  constructor() {
    makeAutoObservable(this);

    if (localStorage.getItem('save')) {
      this.state = JSON.parse(localStorage.getItem('save') || '{}');
    }

    // ensure items have ids (migrate old saves)
    this.state.items = (this.state.items || []).map((it: any) => ({
      id: it.id || this.genId(),
      ...it,
    }));
    this.state.extra = (this.state.extra || []).map((it: any) => ({
      id: it.id || this.genId(),
      ...it,
    }));
  }

  add() {
    this.state.items.push({
      id: this.genId(),
      cost: Number.parseFloat(this.state.tempCost),
      activities: this.state.tempStr,
    });
    this.reset();
  }

  addExtra() {
    this.state.extra.push({
      id: this.genId(),
      cost: Number.parseFloat(this.state.tempCost),
      activities: this.state.tempStr,
    });
    this.reset();
  }

  removeActivity(x: TItem) {
    this.state.items = this.state.items.filter((c) => c.id !== x.id);
    this.persist();
  }

  removeExtra(x: TItem) {
    this.state.extra = this.state.extra.filter((c) => c.id !== x.id);
    this.persist();
  }

  updateActivity(target: TItem, updates: Partial<TItem>) {
    const idx = this.state.items.findIndex((i) => i.id === target.id);
    if (idx >= 0) {
      this.state.items[idx] = { ...this.state.items[idx], ...updates };
      this.persist();
    }
  }

  updateExtra(target: TItem, updates: Partial<TItem>) {
    const idx = this.state.extra.findIndex((i) => i.id === target.id);
    if (idx >= 0) {
      this.state.extra[idx] = { ...this.state.extra[idx], ...updates };
      this.persist();
    }
  }

  persist() {
    localStorage.setItem('save', JSON.stringify(this.state));
  }

  reset() {
    this.state.tempCost = '';
    this.state.tempStr = '';
    this.persist();
  }
}

const controller = new Controller();

type EditableRowProps = {
  item: TItem;
  className: string;
  prefix?: string; // e.g. "$ "
  suffix?: string; // e.g. "hs"
  onRemove: () => void;
  onSave: (updates: { activities?: string; cost?: number }) => void;
};

function EditableRow({
  item,
  className,
  prefix = '',
  suffix = '',
  onRemove,
  onSave,
}: EditableRowProps) {
  const [activitiesStr, setActivitiesStr] = useState(item.activities);
  const [costStr, setCostStr] = useState(String(item.cost));

  // Sync local fields when item updates (e.g., after persist)
  useEffect(() => {
    setActivitiesStr(item.activities);
    setCostStr(String(item.cost));
  }, [item.id, item.activities, item.cost]);

  const commit = () => {
    const updates: { activities?: string; cost?: number } = {};
    if (activitiesStr !== item.activities) updates.activities = activitiesStr;
    const num = Number.parseFloat(costStr);
    if (!Number.isNaN(num) && num !== item.cost) updates.cost = num;
    if (Object.keys(updates).length) onSave(updates);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commit();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <li className={className}>
      <input
        className="item_title"
        value={activitiesStr}
        onChange={(e) => setActivitiesStr(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        placeholder="Activities"
      />
      <div className="item_cost">
        {prefix && <span>{prefix}</span>}
        <input
          value={costStr}
          onChange={(e) => setCostStr(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          placeholder="Cost"
          inputMode="decimal"
        />
        {suffix && <span className="sufix">{suffix}</span>}
        <span className="print">{costStr}hs</span>
      </div>
      <button className="remove" onClick={onRemove}>
        x
      </button>
    </li>
  );
}

const Invoice = observer(() => {
  return (
    <div className="invoice">
      <div className="total_sum">
        <strong>Período: </strong> {periodo}.
      </div>
      <strong>Actividades</strong>
      <ul>
        {controller.state.items.map((c) => (
          <EditableRow
            key={c.id}
            item={c}
            className="item"
            suffix="hs"
            onRemove={() => controller.removeActivity(c)}
            onSave={(updates) => controller.updateActivity(c, updates)}
          />
        ))}
      </ul>
      {controller.state.extra.length > 0 && (
        <>
          <strong>Extra</strong>
          <ul>
            {controller.state.extra.map((c) => (
              <EditableRow
                key={c.id}
                item={c}
                className="extra"
                prefix="$ "
                onRemove={() => controller.removeExtra(c)}
                onSave={(updates) => controller.updateExtra(c, updates)}
              />
            ))}
          </ul>
        </>
      )}
      <div className="total">
        <div>
          <strong>Total horas</strong> {controller.getTotalHours()}hs
        </div>
        <div>
          <strong>Total extra</strong> $ {controller.getTotalExtra()}
        </div>
        <div>
          <strong>Precio hora</strong> $ {controller.state.hourPrice}
        </div>
        <div className="total_sum">
          <strong>Total</strong> $ {controller.getTotal()}
        </div>
      </div>
    </div>
  );
});

const Controls = observer(() => {
  return (
    <div className="controls">
      <input
        placeholder="What"
        value={controller.state.tempStr}
        onChange={(ev) => (controller.state.tempStr = ev.target.value)}
      />
      <input
        placeholder="How much"
        value={controller.state.tempCost}
        onChange={(ev) => (controller.state.tempCost = ev.target.value)}
      />
      <button
        onClick={() => {
          controller.add();
        }}
      >
        activity
      </button>
      <button
        onClick={() => {
          controller.addExtra();
        }}
      >
        extra
      </button>
      <button onClick={() => window.print()}>print</button>
    </div>
  );
});

export function InvoicesComponent() {
  return (
    <>
      <Controls />
      <Invoice />
    </>
  );
}
