import { Node } from '../../store/elements/Node';

export class TaskNode extends Node {
  constructor(...props: ConstructorParameters<typeof Node>) {
    super(...props);

    this.state.Renderer = this.Render;
    this.setDimentions([500, 600]);
  }

  Render = () => {
    return (
      <div
        onMouseDownCapture={(ev) => ev.stopPropagation()}
        onKeyDownCapture={(ev) => ev.stopPropagation()}
      >
        <h1>A form!</h1>
        <form>
          <input />
        </form>
      </div>
    );
  };
}
