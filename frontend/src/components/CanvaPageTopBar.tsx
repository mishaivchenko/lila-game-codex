import { Link } from 'react-router-dom';

interface CanvaPageTopBarItem {
  label: string;
  to?: string;
}

interface CanvaPageTopBarProps {
  backHref?: string;
  backLabel?: string;
  items?: CanvaPageTopBarItem[];
  className?: string;
}

const DEFAULT_ITEMS: CanvaPageTopBarItem[] = [
  { label: 'ГРА', to: '/setup' },
  { label: 'ІСТОРІЯ', to: '/history' },
  { label: 'НАЛАШТУВАННЯ', to: '/settings' },
  { label: 'UA | ENG' },
];

export const CanvaPageTopBar = ({
  backHref,
  backLabel = 'НАЗАД',
  items = DEFAULT_ITEMS,
  className = '',
}: CanvaPageTopBarProps) => (
  <div className={`lila-canva-topbar ${className}`.trim()}>
    <div className="min-h-[20px]">
      {backHref ? (
        <Link className="lila-canva-topbar-link" to={backHref}>
          &lt; {backLabel}
        </Link>
      ) : null}
    </div>
    <div className="lila-canva-topbar-items">
      {items.map((item) => (
        item.to ? (
          <Link key={`${item.label}-${item.to}`} className="lila-canva-topbar-link" to={item.to}>
            {item.label}
          </Link>
        ) : (
          <span key={item.label} className="lila-canva-topbar-link">
            {item.label}
          </span>
        )
      ))}
    </div>
  </div>
);
