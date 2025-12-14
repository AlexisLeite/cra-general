import { CiLight } from 'react-icons/ci';
import { Theme } from '../Theme';

export function ThemeTool() {
  return (
    <CiLight
      className={`tool ${Theme.instance.get() ? 'selected' : ''}`}
      onClick={async () => {
        Theme.instance.toggle();
      }}
      title="Theme"
    />
  );
}
