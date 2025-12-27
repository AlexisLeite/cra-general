import {
  type MouseEvent,
  type MouseEventHandler,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';

export type CollapsiblePanelProps = {
  title?: ReactNode;
  defaultCollapsed?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  resizerSide?: 'left' | 'right';
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  children?: ReactNode;
  onMouseLeave?: MouseEventHandler;
};

type DragState = {
  startX: number;
  startWidth: number;
};

export class CollapsiblePanelStateManager {
  width: number;
  widthBeforeCollapse: number;
  drag: DragState | null = null;
  private suppressNextToggle = false;

  uncontrolledCollapsed: boolean;
  defaultCollapsed: boolean;
  defaultWidth: number;

  constructor(args: { defaultCollapsed: boolean; defaultWidth: number }) {
    this.defaultCollapsed = args.defaultCollapsed;
    this.defaultWidth = args.defaultWidth;

    this.uncontrolledCollapsed = args.defaultCollapsed;
    this.width = args.defaultWidth;
    this.widthBeforeCollapse = args.defaultWidth;

    makeAutoObservable(this);
  }

  syncDefaults(args: { defaultCollapsed: boolean; defaultWidth: number }) {
    if (
      args.defaultCollapsed === this.defaultCollapsed &&
      args.defaultWidth === this.defaultWidth
    ) {
      return;
    }

    this.defaultCollapsed = args.defaultCollapsed;
    this.defaultWidth = args.defaultWidth;

    this.uncontrolledCollapsed = args.defaultCollapsed;
    this.width = args.defaultWidth;
    this.widthBeforeCollapse = args.defaultWidth;
    this.drag = null;
  }

  getIsCollapsed(args: { collapsed?: boolean }) {
    const isControlled = typeof args.collapsed === 'boolean';
    return isControlled
      ? (args.collapsed as boolean)
      : this.uncontrolledCollapsed;
  }

  setCollapsed(args: {
    next: boolean;
    collapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
  }) {
    args.onCollapsedChange?.(args.next);
    const isControlled = typeof args.collapsed === 'boolean';
    if (!isControlled) this.uncontrolledCollapsed = args.next;
  }

  clampWidth(args: { next: number; minWidth: number; maxWidth: number }) {
    return Math.min(args.maxWidth, Math.max(args.minWidth, args.next));
  }

  beginResize(args: { clientX: number; isCollapsed: boolean }) {
    if (args.isCollapsed) return;

    this.suppressNextToggle = false;

    this.drag = {
      startX: args.clientX,
      startWidth: this.width,
    };
  }

  updateResize(args: {
    clientX: number;
    resizerSide: 'left' | 'right';
    minWidth: number;
    maxWidth: number;
  }) {
    if (!this.drag) return;
    if (Math.abs(args.clientX - this.drag.startX) > 2) {
      this.suppressNextToggle = true;
    }
    const delta = args.clientX - this.drag.startX;
    const signedDelta = args.resizerSide === 'left' ? -delta : delta;
    const nextWidth = this.clampWidth({
      next: this.drag.startWidth + signedDelta,
      minWidth: args.minWidth,
      maxWidth: args.maxWidth,
    });
    this.width = nextWidth;
    this.widthBeforeCollapse = nextWidth;
  }

  endResize() {
    this.drag = null;
  }

  toggleCollapsedFromEdge(args: {
    collapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
    minWidth: number;
    maxWidth: number;
  }) {
    if (this.suppressNextToggle) {
      this.suppressNextToggle = false;
      return;
    }
    const isCollapsed = this.getIsCollapsed({ collapsed: args.collapsed });
    if (!isCollapsed) {
      this.widthBeforeCollapse = this.width;
      this.setCollapsed({
        next: true,
        collapsed: args.collapsed,
        onCollapsedChange: args.onCollapsedChange,
      });
      return;
    }

    this.setCollapsed({
      next: false,
      collapsed: args.collapsed,
      onCollapsedChange: args.onCollapsedChange,
    });
    this.width = this.clampWidth({
      next: this.widthBeforeCollapse,
      minWidth: args.minWidth,
      maxWidth: args.maxWidth,
    });
  }
}

export const CollapsiblePanel = observer(function CollapsiblePanel({
  title,
  defaultCollapsed = false,
  collapsed,
  onCollapsedChange,
  resizerSide = 'right',
  defaultWidth = 280,
  minWidth = 220,
  maxWidth = 480,
  children,
  onMouseLeave,
}: CollapsiblePanelProps) {
  const [manager] = useState(
    () =>
      new CollapsiblePanelStateManager({
        defaultCollapsed,
        defaultWidth,
      }),
  );

  manager.syncDefaults({ defaultCollapsed, defaultWidth });

  const isCollapsed = manager.getIsCollapsed({ collapsed });

  const rootClassName = useMemo(
    () =>
      `collapsible_panel ${isCollapsed ? 'collapsed' : ''} collapsible_panel--resizer-${resizerSide}`,
    [isCollapsed, resizerSide],
  );

  const rootStyle = useMemo(() => {
    if (isCollapsed) return { width: 8 };
    return { width: `${manager.width}px` };
  }, [isCollapsed, manager.width]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      manager.updateResize({
        clientX: e.clientX,
        resizerSide,
        minWidth,
        maxWidth,
      });
    };

    const onUp = () => {
      manager.endResize();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [manager, maxWidth, minWidth, resizerSide]);

  const toggleCollapsedFromEdge = useCallback(
    (ev: MouseEvent) => {
      if (ev.defaultPrevented) return;
      manager.toggleCollapsedFromEdge({
        collapsed,
        onCollapsedChange,
        minWidth,
        maxWidth,
      });
    },
    [collapsed, manager, maxWidth, minWidth, onCollapsedChange],
  );

  return (
    <div
      onMouseLeave={onMouseLeave}
      className={rootClassName}
      style={rootStyle}
    >
      <div className="collapsible_panel__header" aria-expanded={!isCollapsed}>
        {title != null && (
          <span className="collapsible_panel__title">{title}</span>
        )}
      </div>
      <div className="collapsible_panel__content" hidden={isCollapsed}>
        {children}
      </div>
      <div
        className="collapsible_panel__resizer"
        role="separator"
        aria-orientation="vertical"
        tabIndex={0}
        onClick={toggleCollapsedFromEdge}
        onPointerDown={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          manager.beginResize({ clientX: e.clientX, isCollapsed });
        }}
      />
    </div>
  );
});
