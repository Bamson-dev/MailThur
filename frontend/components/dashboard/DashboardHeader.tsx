interface DashboardHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function DashboardHeader({
  title,
  description,
  actions,
}: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-page-title text-white">{title}</h1>
        {description ? (
          <p className="mt-1 text-body text-text-heading">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
