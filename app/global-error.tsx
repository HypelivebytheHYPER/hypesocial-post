"use client";

/**
 * Global error boundary — catches errors in the root layout itself.
 * This replaces the entire HTML document when the root layout crashes.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "Inter, system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p
            style={{ fontSize: 14, color: "#a1a1aa", marginBottom: 24 }}
          >
            An unexpected error occurred. Please try again.
            {error.digest && (
              <span style={{ display: "block", marginTop: 8, fontSize: 12, color: "#71717a" }}>
                Error ID: {error.digest}
              </span>
            )}
          </p>
          <button
            onClick={reset}
            style={{
              padding: "8px 20px",
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 6,
              border: "1px solid #27272a",
              backgroundColor: "#18181b",
              color: "#fafafa",
              cursor: "pointer",
              marginRight: 8,
            }}
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            style={{
              padding: "8px 20px",
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 6,
              border: "1px solid #27272a",
              backgroundColor: "transparent",
              color: "#a1a1aa",
              cursor: "pointer",
            }}
          >
            Go home
          </button>
        </div>
      </body>
    </html>
  );
}
