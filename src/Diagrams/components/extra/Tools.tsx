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
import { makeAutoObservable } from 'mobx';
import { LetterTool } from './tools/LetterTool';

export class ToolsStates {
  static instance = new ToolsStates();

  showDragHints = false;

  private constructor() {
    makeAutoObservable(this);
  }
}

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
      <Separator />
      <LetterTool
        title="Toggle drag hints"
        letters="EH"
        active={ToolsStates.instance.showDragHints}
        onClick={() => {
          ToolsStates.instance.showDragHints =
            !ToolsStates.instance.showDragHints;
        }}
      />
    </Toolbar>
  );
});
