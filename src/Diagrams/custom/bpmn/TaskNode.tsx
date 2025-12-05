import { makeObservable, observable } from 'mobx';
import { Node } from '../../store/elements/Node';
import { observer } from 'mobx-react-lite';

export class TaskNode extends Node {
  constructor(...props: ConstructorParameters<typeof Node>) {
    super(...props);

    this.state.Renderer = this.Render;
    this.setDimentions([500, 600]);

    makeObservable(this, { value: observable });
  }

  value = '';

  serialize() {
    return { ...super.serialize(), value: this.value };
  }

  deserialize(o: ReturnType<this['serialize']>): void {
    super.deserialize(o);
    this.value = o.value;
  }

  Render = observer(() => {
    return (
      <div
        onMouseDownCapture={(ev) => ev.stopPropagation()}
        onKeyDownCapture={(ev) => ev.stopPropagation()}
      >
        <h1>A form!</h1>
        <form>
          <input
            value={this.value}
            onChange={(ev) => (this.value = ev.target.value)}
          />
        </form>
      </div>
    );
  });
}
