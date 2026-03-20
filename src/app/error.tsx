"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isTimeout = error.message?.includes("aborted");

  return (
    <main className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center gap-4">
      <img src="/images/logo-wordmark.svg" alt="munchis" className="h-8" />
      <h2 className="font-display text-xl text-forest">
        {isTimeout
          ? "We're having trouble reaching our kitchen"
          : "Something went wrong"}
      </h2>
      <p className="text-sm text-forest/60 max-w-xs">
        {isTimeout
          ? "Our systems are temporarily unavailable. Please try again in a moment."
          : "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-xl bg-forest text-white font-semibold text-sm"
      >
        Try again
      </button>
    </main>
  );
}
