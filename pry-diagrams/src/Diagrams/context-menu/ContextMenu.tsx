import { makeAutoObservable } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { Mouse } from '../util/Mouse';
import type { ContextMenuElement, ContextMenuOpenOptions } from './types';

type Position = {
  x: number;
  y: number;
};

const VIEWPORT_MARGIN = 8;
const SUBMENU_OVERLAP = 2;
const SUBMENU_CLOSE_DELAY = 120;

function clampPosition(
  position: Position,
  size: { width: number; height: number },
) {
  const x = Math.max(
    VIEWPORT_MARGIN,
    Math.min(position.x, window.innerWidth - size.width - VIEWPORT_MARGIN),
  );
  const y = Math.max(
    VIEWPORT_MARGIN,
    Math.min(position.y, window.innerHeight - size.height - VIEWPORT_MARGIN),
  );

  return { x, y };
}

function MenuItem({
  item,
  onAction,
}: {
  item: ContextMenuElement;
  onAction: (item: ContextMenuElement) => void;
}) {
  const hasSubmenu = Boolean(item.submenu?.length);
  const itemRef = useRef<HTMLLIElement | null>(null);
  const submenuRef = useRef<HTMLDivElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [submenuReady, setSubmenuReady] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState({
    left: 0,
    top: -4,
    openToLeft: false,
  });

  const updateSubmenuPosition = useCallback(() => {
    if (!itemRef.current || !submenuRef.current) {
      return;
    }

    const triggerRect = itemRef.current.getBoundingClientRect();
    const submenuRect = submenuRef.current.getBoundingClientRect();

    let left = triggerRect.width - SUBMENU_OVERLAP;
    let openToLeft = false;

    if (
      triggerRect.right - SUBMENU_OVERLAP + submenuRect.width >
      window.innerWidth - VIEWPORT_MARGIN
    ) {
      left = -submenuRect.width + SUBMENU_OVERLAP;
      openToLeft = true;
    }

    if (triggerRect.left + left < VIEWPORT_MARGIN) {
      left = VIEWPORT_MARGIN - triggerRect.left;
      openToLeft = false;
    }

    let top = -4;
    let absoluteTop = triggerRect.top + top;

    if (absoluteTop + submenuRect.height > window.innerHeight - VIEWPORT_MARGIN) {
      top -=
        absoluteTop +
        submenuRect.height -
        (window.innerHeight - VIEWPORT_MARGIN);
      absoluteTop = triggerRect.top + top;
    }

    if (absoluteTop < VIEWPORT_MARGIN) {
      top += VIEWPORT_MARGIN - absoluteTop;
    }

    setSubmenuPosition({ left, top, openToLeft });
    setSubmenuReady(true);
  }, []);

  useEffect(() => {
    if (!submenuOpen) {
      setSubmenuReady(false);
    }
  }, [submenuOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!submenuOpen) {
      return;
    }

    updateSubmenuPosition();
  }, [submenuOpen, updateSubmenuPosition]);

  useEffect(() => {
    if (!submenuOpen) {
      return;
    }

    const handleResize = () => {
      updateSubmenuPosition();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [submenuOpen, updateSubmenuPosition]);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const openSubmenu = () => {
    if (hasSubmenu) {
      clearCloseTimeout();
      setSubmenuOpen(true);
    }
  };

  const closeSubmenu = () => {
    clearCloseTimeout();
    setSubmenuOpen(false);
  };

  const scheduleCloseSubmenu = () => {
    if (!hasSubmenu) {
      return;
    }

    clearCloseTimeout();
    closeTimeoutRef.current = window.setTimeout(() => {
      setSubmenuOpen(false);
      closeTimeoutRef.current = null;
    }, SUBMENU_CLOSE_DELAY);
  };

  const handleBlur = (ev: FocusEvent<HTMLLIElement>) => {
    const nextTarget = ev.relatedTarget as Node | null;

    if (!nextTarget || !ev.currentTarget.contains(nextTarget)) {
      closeSubmenu();
    }
  };

  return (
    <li
      ref={itemRef}
      className={[
        'diagram__context_menu_item',
        item.disabled && 'disabled',
        item.danger && 'danger',
        hasSubmenu && 'has_submenu',
        submenuOpen && 'submenu_open',
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseEnter={openSubmenu}
      onMouseLeave={scheduleCloseSubmenu}
      onFocusCapture={openSubmenu}
      onBlurCapture={handleBlur}
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
          <span className="diagram__context_menu_chevron">
            {submenuPosition.openToLeft ? '<' : '>'}
          </span>
        )}
      </button>
      {hasSubmenu && submenuOpen && (
        <div
          ref={submenuRef}
          className="diagram__context_menu_submenu"
          style={{
            left: submenuPosition.left,
            top: submenuPosition.top,
            opacity: submenuReady ? 1 : 0,
          }}
        >
          <div className="diagram__context_menu diagram__context_menu--nested">
            <MenuItems items={item.submenu!} onAction={onAction} />
          </div>
        </div>
      )}
    </li>
  );
}

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
        return (
          <MenuItem
            key={`${item.label}_${index}`}
            item={item}
            onAction={onAction}
          />
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
    const { x, y } = clampPosition(menu.position, { width, height });

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
