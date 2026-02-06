import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { Mouse } from '../util/Mouse';
import type { ContextMenuElement, ContextMenuOpenOptions } from './types';

type Position = {
  x: number;
  y: number;
};

const VIEWPORT_MARGIN = 8;

function MenuItems({
  items,
  onAction,
}: {
  items: ContextMenuElement[];
  onAction: (item: ContextMenuElement) => void;
}) {
  return (
    <ul className="diagram__context_menu_list">
      {items.map((item, index) => {
        const hasSubmenu = Boolean(item.submenu?.length);

        return (
          <li
            key={`${item.label}_${index}`}
            className={[
              'diagram__context_menu_item',
              item.disabled && 'disabled',
              item.danger && 'danger',
              hasSubmenu && 'has_submenu',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <button
              type="button"
              className="diagram__context_menu_button"
              disabled={item.disabled}
              onClick={(ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                onAction(item);
              }}
            >
              <span className="diagram__context_menu_label">{item.label}</span>
              {hasSubmenu && (
                <span className="diagram__context_menu_chevron">{'>'}</span>
              )}
            </button>
            {hasSubmenu && (
              <div className="diagram__context_menu_submenu">
                <div className="diagram__context_menu diagram__context_menu--nested">
                  <MenuItems items={item.submenu!} onAction={onAction} />
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const ContextMenuRenderer = observer(({ menu }: { menu: ContextMenuStore }) => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<Position>(menu.position);

  useEffect(() => {
    if (menu.opened) {
      setPosition(menu.position);
    }
  }, [menu.openVersion, menu.opened, menu.position]);

  useLayoutEffect(() => {
    if (!menu.opened || !menuRef.current) {
      return;
    }

    const { width, height } = menuRef.current.getBoundingClientRect();

    let x = menu.position.x;
    let y = menu.position.y;

    if (x + width > window.innerWidth - VIEWPORT_MARGIN) {
      x = Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN);
    }

    if (y + height > window.innerHeight - VIEWPORT_MARGIN) {
      y = Math.max(
        VIEWPORT_MARGIN,
        window.innerHeight - height - VIEWPORT_MARGIN,
      );
    }

    if (x !== position.x || y !== position.y) {
      setPosition({ x, y });
    }
  }, [menu.openVersion, menu.opened, menu.position, position.x, position.y]);

  useEffect(() => {
    if (!menu.opened) {
      return;
    }

    const closeOnEscape = (ev: KeyboardEvent) => {
      if (ev.code === 'Escape') {
        menu.close();
      }
    };

    const closeOnOutsideMouseDown = (ev: MouseEvent) => {
      const target = ev.target as Node | null;
      if (target && menuRef.current?.contains(target)) {
        return;
      }

      menu.close();
    };

    const closeOnOutsideContextMenu = (ev: MouseEvent) => {
      const target = ev.target as Node | null;
      if (target && menuRef.current?.contains(target)) {
        ev.preventDefault();
        return;
      }

      menu.close();
    };

    const closeOnResize = () => {
      menu.close();
    };

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('mousedown', closeOnOutsideMouseDown, true);
    document.addEventListener('contextmenu', closeOnOutsideContextMenu, true);
    window.addEventListener('resize', closeOnResize);

    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('mousedown', closeOnOutsideMouseDown, true);
      document.removeEventListener(
        'contextmenu',
        closeOnOutsideContextMenu,
        true,
      );
      window.removeEventListener('resize', closeOnResize);
    };
  }, [menu, menu.openVersion, menu.opened]);

  if (!menu.opened || !menu.elements.length) {
    return null;
  }

  return (
    <div className="diagram__context_menu_layer">
      <div
        ref={menuRef}
        className="diagram__context_menu"
        style={{ left: position.x, top: position.y }}
        onMouseDown={(ev: ReactMouseEvent<HTMLDivElement>) => {
          ev.stopPropagation();
        }}
        onContextMenu={(ev: ReactMouseEvent<HTMLDivElement>) => {
          ev.preventDefault();
          ev.stopPropagation();
        }}
      >
        <MenuItems
          items={menu.elements}
          onAction={(item) => {
            menu.execute(item);
          }}
        />
      </div>
    </div>
  );
});

class ContextMenuStore {
  private _elements: ContextMenuElement[] = [];
  private _opened = false;
  private _position: Position = { x: 0, y: 0 };
  private _openVersion = 0;

  public readonly Component = () => {
    return <ContextMenuRenderer menu={this} />;
  };

  constructor() {
    makeAutoObservable(
      this,
      {
        Component: false,
      },
      { autoBind: true },
    );
  }

  public get elements() {
    return this._elements;
  }

  public get opened() {
    return this._opened;
  }

  public get position() {
    return this._position;
  }

  public get openVersion() {
    return this._openVersion;
  }

  open(elements: ContextMenuElement[], options: ContextMenuOpenOptions = {}) {
    if (!elements.length) {
      this.close();
      return;
    }

    const mouse = Mouse.getInstance().coordinates;

    this._elements = elements;
    this._position = {
      x: options.x ?? mouse.x,
      y: options.y ?? mouse.y,
    };
    this._openVersion += 1;
    this._opened = true;
  }

  close() {
    if (!this._opened) {
      return;
    }

    this._opened = false;
    this._elements = [];
  }

  execute(item: ContextMenuElement) {
    if (item.disabled) {
      return;
    }

    try {
      const output = item.onClick();
      if (output instanceof Promise) {
        void output.catch(() => {
          /* empty */
        });
      }
    } catch {
      /* empty */
    }

    if (!item.submenu?.length) {
      this.close();
    }
  }
}

export const ContextMenu = new ContextMenuStore();
