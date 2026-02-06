import type { ReactNode } from 'react';

type TabItem<T extends string> = {
  key: T;
  label: string;
};

type TabsPanelProps<T extends string> = {
  activeTab: T;
  onTabChange: (tab: T) => void;
  tabs: readonly TabItem<T>[];
  children: ReactNode;
};

export function TabsPanel<T extends string>({
  activeTab,
  onTabChange,
  tabs,
  children,
}: TabsPanelProps<T>) {
  return (
    <div className="diagram__left_panel_shell">
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
    </div>
  );
}
