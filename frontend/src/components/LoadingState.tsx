export const LoadingState = ({ label }: { label: string }) => (
  <div className="app-empty">
    <div className="skeleton h-10 w-40" />
    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
  </div>
);
