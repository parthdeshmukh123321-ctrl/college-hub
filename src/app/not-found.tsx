import Link from "next/link";
export default function NotFound() {
  return (
    <div className="surface hairline mx-auto mt-10 max-w-md rounded-xl border p-8 text-center">
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="muted mt-2 text-sm">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      <div className="mt-4 flex justify-center gap-2">
        <Link href="/" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-900">Home</Link>
        <Link href="/resources" className="surface hairline rounded-lg border px-4 py-2 text-sm font-medium">Browse resources</Link>
      </div>
    </div>
  );
}
