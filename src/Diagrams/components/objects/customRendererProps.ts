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
  return {
    onMouseOver: () => node.setState('hover', true),
    onMouseOut: () => node.setState('hover', false),
    'data-id': node.id,
    style: customRendererStyles(node),
    className: node.classList.string,
  };
}
