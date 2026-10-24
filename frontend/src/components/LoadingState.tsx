export function LoadingState({ label = "Loading inventory..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-12 text-sm font-medium text-slate-500" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      {label}
    </div>
  );
}
