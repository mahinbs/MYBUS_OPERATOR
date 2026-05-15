import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--app-surface)] px-4 text-center">
      <h1 className="text-5xl font-semibold text-slate-800">404</h1>
      <p className="mt-4 text-lg text-slate-600">Page not found</p>
      <Link
        href="/"
        className="mt-8 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-700"
      >
        Back to MY BUS
      </Link>
    </div>
  );
}
