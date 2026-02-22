import { Coordinates } from '../store/primitives/Coordinates';
import { Diagram } from '../store/Diagram';
import { Selector } from '../store/extensions/Selector';
import type { ContextMenuElement } from './types';

const noop = () => {};

function hasClipboardSupport() {
  return (
    typeof navigator !== 'undefined' &&
    Boolean(navigator.clipboard?.writeText) &&
    Boolean(navigator.clipboard?.readText)
  );
}

function runAsync(action: () => Promise<void>) {
  return () => {
    void action().catch(() => {
      /* empty */
    });
  };
}

export function buildDiagramContextMenu(
  diagram: Diagram,
  target: HTMLElement,
  cursor: { x: number; y: number },
) {
  const selector = diagram.getExtension(Selector);

  const nodeId = target.closest<HTMLElement>('.diagram__node')?.dataset.id;
  const edgeId = target.closest<HTMLElement>('.edge')?.dataset.id;

  const targetNode = nodeId ? diagram.getNodeById(nodeId) : undefined;
  const targetEdge = edgeId ? diagram.getEdgeById(edgeId) : undefined;

  if (targetNode && !targetNode.selected) {
    selector.clearSelection();
    selector.selectNode(targetNode);
  } else if (targetEdge && !targetEdge.state.selected) {
    selector.clearSelection();
    selector.selectEdge(targetEdge);
  }

  const selectedNodes = selector.selectedNodes;
  const selectedEdges = selector.selectedEdges;
  const hasSelection = selectedNodes.length + selectedEdges.length > 0;

  const clipboardEnabled = hasClipboardSupport();
  const canCopy = clipboardEnabled && selectedNodes.length > 0;

  const deleteSelection = () => {
    selector.selectedNodes.forEach((node) => {
      diagram.delete(node);
    });
    selector.selectedEdges.forEach((edge) => {
      diagram.disconnect(edge);
    });
  };

  const menu: ContextMenuElement[] = [];

  if (targetNode) {
    menu.push({
      label: `Node: ${targetNode.state.label || targetNode.id}`,
      onClick: noop,
      submenu: [
        {
          label: 'Center node',
          onClick: () => {
            diagram.canvas.centerOnPoint(targetNode.box.middle);
          },
        },
        {
          label: 'Delete node',
          onClick: () => {
            diagram.delete(targetNode);
          },
          danger: true,
        },
      ],
    });
  } else if (targetEdge) {
    menu.push({
      label: 'Edge',
      onClick: noop,
      submenu: [
        {
          label: 'Delete edge',
          onClick: () => {
            diagram.disconnect(targetEdge);
          },
          danger: true,
        },
      ],
    });
  }

  if (hasSelection) {
    menu.push({
      label: `Delete selection`,
      onClick: deleteSelection,
      danger: true,
    });
  }

  menu.push({
    label: 'Selection',
    onClick: noop,
    submenu: [
      {
        label:
          selector.selectionMode === 'element'
            ? 'Element mode (active)'
            : 'Element mode',
        onClick: () => {
          selector.toggleSelectionMode('element');
        },
      },
      {
        label:
          selector.selectionMode === 'area' ? 'Area mode (active)' : 'Area mode',
        onClick: () => {
          selector.toggleSelectionMode('area');
        },
      },
      {
        label: 'Clear selection',
        onClick: () => {
          selector.clearSelection();
        },
        disabled: !hasSelection,
      },
      {
        label: 'Copy selection',
        onClick: runAsync(async () => {
          await navigator.clipboard.writeText(selector.copy());
        }),
        disabled: !canCopy,
      },
      {
        label: 'Paste',
        onClick: runAsync(async () => {
          const content = await navigator.clipboard.readText();
          if (content.trim().length) {
            diagram.paste(content);
          }
        }),
        disabled: !clipboardEnabled,
      },
    ],
  });

  const zoomCenter = new Coordinates([cursor.x, cursor.y]);

  menu.push({
    label: 'View',
    onClick: noop,
    submenu: [
      {
        label: diagram.showGrid ? 'Hide grid' : 'Show grid',
        onClick: () => {
          diagram.toggleGrid();
        },
      },
      {
        label: `Zoom (${Math.round(diagram.canvas.scale * 100)}%)`,
        onClick: noop,
        submenu: [
          {
            label: 'Zoom in',
            onClick: () => {
              diagram.canvas.setScale(diagram.canvas.scale + 0.1, zoomCenter);
            },
          },
          {
            label: 'Zoom out',
            onClick: () => {
              diagram.canvas.setScale(diagram.canvas.scale - 0.1, zoomCenter);
            },
          },
          {
            label: 'Reset zoom',
            onClick: () => {
              diagram.canvas.setScale(1, zoomCenter);
            },
          },
        ],
      },
    ],
  });

  return menu;
}
