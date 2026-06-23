import { Button } from "./Button.jsx";

export function EmptyState({ title, description, actionLabel, actionTo, onAction }) {
  return (
    <section className="state-panel">
      <div className="state-panel-mark" aria-hidden="true" />
      <div className="stack">
        <h2>{title}</h2>
        <p className="muted">{description}</p>
      </div>
      <div className="state-panel-actions">
        {actionLabel && actionTo ? (
          <Button to={actionTo}>{actionLabel}</Button>
        ) : null}
        {actionLabel && onAction ? (
          <Button type="button" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry, secondaryTo, secondaryLabel }) {
  return (
    <section className="state-panel">
      <div className="state-panel-mark state-panel-mark-error" aria-hidden="true" />
      <div className="stack">
        <h2>{title}</h2>
        <p className="muted">{message || "Please try again."}</p>
      </div>
      <div className="state-panel-actions">
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
        <div className="skeleton-card" key={index}>
          <div className="skeleton skeleton-card-image" />
          <div className="skeleton-card-body">
            <div className="skeleton skeleton-line" style={{ width: "42%" }} />
            <div className="skeleton skeleton-line" style={{ width: "86%" }} />
            <div className="skeleton skeleton-line" />
            <div className="skeleton-card-footer">
              <div className="skeleton skeleton-line" style={{ width: "34%" }} />
              <div className="skeleton skeleton-button" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="detail-grid" aria-busy="true" aria-label="Loading detail">
      <div className="skeleton detail-image-skeleton" />
      <div className="surface surface-padded stack-lg">
        <div className="skeleton skeleton-line" style={{ width: "42%" }} />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line" style={{ width: "80%" }} />
        <div className="skeleton" style={{ minHeight: 160 }} />
        <div className="skeleton skeleton-button" />
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
