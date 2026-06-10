export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <header className="page-header">
      <div className="page-header-row">
        <div className="stack">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 className="page-title">{title}</h1>
          {description ? <p className="lead">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </header>
  );
}

export function ManagerPageHeader({ title, description, action }) {
  return (
    <header className="page-header">
      <div className="page-header-row">
        <div className="stack">
          <h1 className="manager-title">{title}</h1>
          {description ? <p className="lead">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </header>
  );
}
