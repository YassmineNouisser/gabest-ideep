export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-danger/30 bg-red-50 px-4 py-3 text-sm font-medium text-danger" role="alert">
      {message}
    </div>
  );
}
