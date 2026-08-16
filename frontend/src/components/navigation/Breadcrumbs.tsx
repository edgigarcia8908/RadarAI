export interface Crumb {
  label: string;
  onClick?: () => void;
  isHome?: boolean;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Migas de pan">
      {items.map((item, i) => {
        const esUltimo = i === items.length - 1;
        return (
          <span key={i} className="breadcrumbs-item">
            {i > 0 && <span className="breadcrumbs-sep" aria-hidden="true">›</span>}
            {esUltimo || !item.onClick ? (
              <span className={esUltimo ? 'breadcrumbs-current' : 'breadcrumbs-home'}>{item.label}</span>
            ) : (
              <button type="button" className="breadcrumbs-link" onClick={item.onClick}>
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}