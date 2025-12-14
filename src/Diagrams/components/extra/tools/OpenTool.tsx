import { PiFolder } from 'react-icons/pi';
import { Diagram } from '../../../store/Diagram';
import { readFile } from '../../../util/readFile';

export function OpenTool() {
  const d = Diagram.use();

  return (
    <PiFolder
      className="tool"
      onClick={async () => {
        const content = await readFile();
        if (content) d.import(content);
      }}
      title="Open"
    />
  );
}
