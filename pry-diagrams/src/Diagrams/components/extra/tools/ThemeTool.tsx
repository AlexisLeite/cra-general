import { CiLight } from 'react-icons/ci';
import { observer } from 'mobx-react-lite';
import { Theme } from '../Theme';

export const ThemeTool = observer(function ThemeTool() {
  return (
    <CiLight
      className={`tool ${Theme.instance.get() ? 'selected' : ''}`}
      onClick={async () => {
        Theme.instance.toggle();
      }}
      title="Theme"
    />
  );
});
