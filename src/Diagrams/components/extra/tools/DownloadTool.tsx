import { TfiSaveAlt } from 'react-icons/tfi';
import { Diagram } from '../../../store/Diagram';
import { downloadFile } from '../../../util/downloadFile';

export function DownloadTool() {
  const d = Diagram.use();

  return (
    <TfiSaveAlt
      className="tool"
      onClick={() => {
        downloadFile(d.export(), 'diagram-save.json', 'application/json');
      }}
      title="Download"
    />
  );
}
