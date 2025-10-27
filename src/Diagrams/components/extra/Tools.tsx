import { observer } from 'mobx-react-lite';
import { TfiRulerAlt } from 'react-icons/tfi';
import { TfiHandDrag } from 'react-icons/tfi';
import { TfiLayoutSidebarNone } from 'react-icons/tfi';
import { PiGridFourThin } from 'react-icons/pi';
import { Diagram } from '../../store/Diagram';
import { SVGAttributes } from 'react';
import { TfiSaveAlt } from 'react-icons/tfi';
import { downloadFile } from '../../util/downloadFile';
import { PiFolder } from 'react-icons/pi';
import { readFile } from '../../util/readFile';
import { IoText } from 'react-icons/io5';

interface IconBaseProps extends SVGAttributes<SVGElement> {
  size?: string | number;
  color?: string;
  title?: string;
}
const MiSnapToGrid = (props: IconBaseProps) => (
  <svg
    viewBox="0 0 256 256"
    fill="currentColor"
    height="1em"
    width="1em"
    {...props}
  >
    {props.title && <title>{props.title}</title>}
    <path d="M200,44H56A12,12,0,0,0,44,56V200a12,12,0,0,0,12,12H200a12,12,0,0,0,12-12V56A12,12,0,0,0,200,44Zm4,12v68H132V52h68A4,4,0,0,1,204,56ZM56,52h68v72H52V56A4,4,0,0,1,56,52ZM52,200V132h72v72H56A4,4,0,0,1,52,200Zm148,4H132V132h72v68A4,4,0,0,1,200,204Z" />
    <circle cx="50" cy="50" r="50" stroke="black" fill="black" />
  </svg>
);

export const Tools = observer(() => {
  const d = Diagram.use();

  return (
    <div className="toolbar">
      <TfiHandDrag
        className={`tool ${d.eventsEnabled ? 'selected' : ''}`}
        onClick={() => {
          d.enableEvents();
        }}
        title="Move"
      />
      <TfiLayoutSidebarNone
        className={`tool ${d.selector.selectionModeEnabled ? 'selected' : ''}`}
        onClick={() => {
          d.selector.enableSelectionMode();
        }}
        title="Select"
      />
      <TfiRulerAlt
        className={`tool ${d.measurer.enabled ? 'selected' : ''}`}
        onClick={() => {
          d.measurer.enable();
        }}
        title="Ruler"
      />
      <div className="separator"></div>
      <IoText
        className={`tool ${d.creator.creationMode === 'text' ? 'selected' : ''}`}
        onClick={() => (d.creator.creationMode = 'text')}
        title="Add text"
      />
      <div className="separator"></div>
      <PiGridFourThin
        className={`tool ${d.showGrid ? 'selected' : ''}`}
        onClick={() => d.toggleGrid()}
        title="Show grid"
      />
      <MiSnapToGrid
        className={`tool ${d.snapToGrid ? 'selected' : ''}`}
        onClick={() => d.toggleSnapToGrid()}
        title="Snap to grid"
      />
      <div className="separator"></div>
      <TfiSaveAlt
        className={`tool`}
        onClick={() => {
          downloadFile(d.export(), 'diagram-save.json', 'application/json');
        }}
        title="Download"
      />
      <PiFolder
        className={`tool`}
        onClick={async () => {
          const content = await readFile();
          if (content) d.import(content);
        }}
        title="Open"
      />
    </div>
  );
});
