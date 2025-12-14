import { observer } from 'mobx-react-lite';
import { AddTextTool } from './tools/AddTextTool';
import { DownloadTool } from './tools/DownloadTool';
import { OpenTool } from './tools/OpenTool';
import { RulerTool } from './tools/RulerTool';
import { SelectTool } from './tools/SelectTool';
import { ShowGridTool } from './tools/ShowGridTool';
import { SnapToGridTool } from './tools/SnapToGridTool';
import { ThemeTool } from './tools/ThemeTool';
import { MoveTool } from './tools/MoveTool';
import { Separator } from './tools/Separator';
import { Toolbar } from './Toolbar';

export const Tools = observer(() => {
  return (
    <Toolbar>
      <MoveTool />
      <SelectTool />
      <RulerTool />
      <Separator />
      <AddTextTool />
      <Separator />
      <ShowGridTool />
      <SnapToGridTool />
      <Separator />
      <DownloadTool />
      <OpenTool />
      <Separator />
      <ThemeTool />
    </Toolbar>
  );
});
