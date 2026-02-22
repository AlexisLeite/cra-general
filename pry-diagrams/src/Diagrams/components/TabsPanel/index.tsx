import { useCallback, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import { CollapsiblePanelStateManager } from '../../layout/CollapsiblePanel';

type TabItem<T extends string> = {
  key: T;
  label: string;
};

type TabsPanelProps<T extends string> = {
  activeTab: T;
  onTabChange: (tab: T) => void;
  tabs: readonly TabItem<T>[];
  children: ReactNode;
  id?: string;
  defaultCollapsed?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
};

export const TabsPanel = observer(function TabsPanel<T extends string>({
  activeTab,
  onTabChange,
  tabs,
  children,
  id,
  defaultCollapsed = false,
  collapsed,
  onCollapsedChange,
  defaultWidth = 320,
  minWidth = 260,
  maxWidth = 520,
}: TabsPanelProps<T>) {
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
    () => `diagram__left_panel_shell ${isCollapsed ? 'collapsed' : ''}`,
    [isCollapsed],
  );

  const rootStyle = useMemo(() => {
    if (isCollapsed) return { width: 8 };
    return { width: `${manager.width}px` };
  }, [isCollapsed, manager.width]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      manager.updateResize({
        clientX: e.clientX,
        resizerSide: 'right',
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
  }, [manager, maxWidth, minWidth]);

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
    <div className={rootClassName} style={rootStyle} id={id}>
      {!isCollapsed && (
        <>
          <div className="diagram__left_tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`diagram__left_tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => onTabChange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="diagram__left_panel_content">{children}</div>
        </>
      )}

      <div
        className="diagram__left_panel_resizer"
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
