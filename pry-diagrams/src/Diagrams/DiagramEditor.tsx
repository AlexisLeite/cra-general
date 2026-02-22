import { observer } from 'mobx-react-lite';
import type { MouseEvent, ReactNode } from 'react';
import { Diagram } from './store/Diagram';
import { NodesConnectorRenderer } from './components/extra/NodesConnectorRenderer';
import { Tools } from './components/extra/Tools';
import { Measurement } from './components/extra/Measurement';
import { Selection } from './components/extra/Selection';
import { Grid } from './components/objects/Grid';
import { Canvas } from './components/Canvas';
import { Stage } from './layout/HStack';
import { AlignmentSuggestions } from './components/extra/AlignmentSuggestions';
import { PathFindingRenderer } from './components/extra/PathFindingRenderer';
import { ContextMenu, buildDiagramContextMenu } from './context-menu';

import './diagram.css';

type DiagramEditorProps = {
  diagram: Diagram;
  leftPanel?: ReactNode;
  toolbar?: ReactNode;
};

export const DiagramEditor = observer(
  ({ diagram, leftPanel, toolbar = <Tools /> }: DiagramEditorProps) => {
    const handleContextMenu = (ev: MouseEvent<HTMLDivElement>) => {
      const target = ev.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.closest('input, textarea, [contenteditable="true"]')) {
        ContextMenu.close();
        return;
      }

      ev.preventDefault();

      ContextMenu.open(
        buildDiagramContextMenu(diagram, target, {
          x: ev.clientX,
          y: ev.clientY,
        }),
        {
          x: ev.clientX,
          y: ev.clientY,
        },
      );
    };

    return (
      <diagram.Context>
        <Stage onContextMenu={handleContextMenu}>
          {leftPanel}
          <Canvas>
            <Grid />
            <NodesConnectorRenderer />
            <Measurement />
            <AlignmentSuggestions />
            <Selection />
            <PathFindingRenderer />
          </Canvas>
        </Stage>
        <ContextMenu.Component />
        {toolbar}
      </diagram.Context>
    );
  },
);
