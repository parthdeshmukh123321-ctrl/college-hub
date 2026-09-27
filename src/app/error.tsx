"use client";
import Link from "next/link";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="surface hairline mx-auto mt-10 max-w-md rounded-xl border p-8 text-center" role="alert">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="muted mt-2 text-sm">We couldn&apos;t load this section. Your data is safe — please try again.</p>
      <div className="mt-4 flex justify-center gap-2">
        <button onClick={reset} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Retry</button>
        <Link href="/resources" className="surface hairline rounded-lg border px-4 py-2 text-sm font-medium">Back to Resources</Link>
      </div>
      {process.env.NODE_ENV === "development" && <pre className="muted mt-4 overflow-auto text-left text-[11px]">{error.message}</pre>}
    </div>
  );
}
