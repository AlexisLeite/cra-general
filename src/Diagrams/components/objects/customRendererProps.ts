import { Node } from '../../store/elements/Node';

type DivProps = React.DetailedHTMLProps<React.HTMLAttributes<any>, any> & {
  [key: `data-${string}`]: string | number | boolean | undefined;
};

export function customRendererStyles(
  node: Node<any>,
): React.DetailedHTMLProps<React.HTMLAttributes<any>, any>['style'] {
  return {
    position: 'absolute',
    left: `${node.box.x}px`,
    top: `${node.box.y}px`,
    zIndex: node.state.hover ? node.state.zIndex! + 1 : node.state.zIndex!,
    width: `${node.box.width}px`,
    height: `${node.box.height}px`,
  };
}

export function customRendererProps(node: Node<any>): DivProps {
  const style = customRendererStyles(node) as DivProps['style'] & {
    [key: `--${string}`]: string | undefined;
  };

  if (node.state.fill) {
    style['--node-fill'] = node.state.fill;
  }
  if (node.state.stroke) {
    style['--node-stroke'] = node.state.stroke;
  }

  return {
    onMouseOver: () => node.setState('hover', true),
    onMouseOut: (ev) => {
      const nextTarget = ev.relatedTarget;
      if (
        nextTarget instanceof Element &&
        nextTarget.closest(
          `[data-id="${node.id}"], [data-gateway-parent="${node.id}"]`,
        )
      ) {
        return;
      }

      node.setState('hover', false);
    },
    'data-id': node.id,
    style,
    className: node.classList.string,
  };
}
