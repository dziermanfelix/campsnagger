export default function Spinner({ className = 'h-8 w-8', label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-stone-700 border-t-emerald-400 ${className}`}
      role='status'
      aria-label={label}
    />
  );
}
