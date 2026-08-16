export interface Crumb {
  label: string;
  onClick?: () => void;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="view-breadcrumbs" aria-label="Migas de pan">
      {items.map((item, i) => {
        const esUltimo = i === items.length - 1;
        return (
          <span key={i}>
            {i > 0 && <span className="view-breadcrumbs-sep">›</span>}
            {esUltimo || !item.onClick ? (
              <span className="view-breadcrumbs-actual">{item.label}</span>
            ) : (
              <button type="button" className="view-breadcrumbs-link" onClick={item.onClick}>
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}