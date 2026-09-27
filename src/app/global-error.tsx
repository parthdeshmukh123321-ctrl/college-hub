"use client";
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en"><body style={{ fontFamily: "system-ui", padding: 40, textAlign: "center" }}>
      <h1>Something went wrong</h1>
      <p>Please refresh the page. If the problem persists, your saved data can be exported from Settings.</p>
      <button onClick={reset} style={{ padding: "10px 20px", borderRadius: 8, background: "#111", color: "#fff", border: 0 }}>Retry</button>
    </body></html>
  );
}
