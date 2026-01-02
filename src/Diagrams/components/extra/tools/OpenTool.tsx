import { PiFolder } from 'react-icons/pi';
import { observer } from 'mobx-react-lite';
import { Diagram } from '../../../store/Diagram';
import { readFile } from '../../../util/readFile';

export const OpenTool = observer(function OpenTool() {
  const d = Diagram.use();

  return (
    <PiFolder
      className="tool"
      onClick={async () => {
        const content = await readFile();
        if (content) {
          if (await d.reset()) {
            d.import(content);
          }
        }
      }}
      title="Open"
    />
  );
});
