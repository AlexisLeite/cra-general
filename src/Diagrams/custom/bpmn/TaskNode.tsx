import { makeObservable, observable } from 'mobx';
import { Node } from '../../store/elements/Node';
import { observer } from 'mobx-react-lite';

export class TaskNode extends Node {
  constructor(...props: ConstructorParameters<typeof Node>) {
    super(...props);

    this.state.Renderer = this.Render;
    this.setDimentions([300, 150]);

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
      <div onKeyDownCapture={(ev) => ev.stopPropagation()}>{this.state.id}</div>
    );
  });
}
