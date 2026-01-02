import { Node } from '../../store/elements/Node';

type DivProps = React.DetailedHTMLProps<React.HTMLAttributes<any>, any> & {
  [key: `data-${string}`]: string | number | boolean | undefined;
};

export function customRendererProps(node: Node<any>): DivProps {
  return {
    onMouseOver: () => node.setState('hover', true),
    onMouseOut: () => node.setState('hover', false),
    'data-id': node.id,
    style: {
      position: 'absolute',
      left: `${node.box.x}px`,
      top: `${node.box.y}px`,
      zIndex: node.state.hover ? 2 : 1,
      width: `${node.box.width}px`,
      height: `${node.box.height}px`,
    },
    className: node.classList.string,
  };
}
