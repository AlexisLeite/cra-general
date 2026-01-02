import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import { useEditableNode } from './EditableNodeContext';
import { useRef } from 'react';
import { allowEventInEdition } from './EditionMode';

export const EditableLabel = observer(() => {
  const node = useEditableNode();
  const focused = useRef(false);

  if (node.editionMode) {
    return (
      <textarea
        className="editable__label"
        autoFocus
        value={node.state.label}
        onChange={(ev) => {
          runInAction(() => {
            node.state.label = ev.target.value;
          });
        }}
        onKeyDownCapture={(ev) => {
          if (node.editionMode && !allowEventInEdition(ev.nativeEvent)) {
            ev.nativeEvent.stopImmediatePropagation();
          }
        }}
        ref={(el) => {
          if (el instanceof HTMLTextAreaElement && !focused.current) {
            focused.current = true;
            el.select();
          }
        }}
      />
    );
  }

  focused.current = false;

  return <pre className="editable__label">{node.state.label}</pre>;
});
