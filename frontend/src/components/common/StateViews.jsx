import { Button } from "./Button.jsx";

export function EmptyState({ title, description, actionLabel, actionTo, onAction }) {
  return (
    <section className="state-panel">
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      {actionLabel && actionTo ? (
        <Button to={actionTo}>{actionLabel}</Button>
      ) : null}
      {actionLabel && onAction ? (
        <Button type="button" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </section>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry, secondaryTo, secondaryLabel }) {
  return (
    <section className="state-panel">
      <h2>{title}</h2>
      <p className="muted">{message || "Please try again."}</p>
      <div className="cluster">
        {onRetry ? (
          <Button type="button" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
        {secondaryTo && secondaryLabel ? (
          <Button variant="secondary" to={secondaryTo}>
            {secondaryLabel}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export function ProductGridSkeleton({ count = 4 }) {
  return (
    <div className="skeleton-grid" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton skeleton-card" key={index} />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="detail-grid" aria-busy="true" aria-label="Loading detail">
      <div className="skeleton" style={{ minHeight: 420 }} />
      <div className="stack-lg">
        <div className="skeleton skeleton-line" style={{ width: "42%" }} />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" style={{ width: "80%" }} />
        <div className="skeleton" style={{ minHeight: 160 }} />
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="table-wrap" aria-busy="true">
      <div className="skeleton-table-row skeleton" />
      <div className="skeleton-table-row skeleton" />
      <div className="skeleton-table-row skeleton" />
    </div>
  );
}
