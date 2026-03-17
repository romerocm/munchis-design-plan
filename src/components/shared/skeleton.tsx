"use client";

export function DropPageSkeleton() {
  return (
    <main className="min-h-screen w-full max-w-lg mx-auto bg-cream flex flex-col animate-pulse">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-4">
        <div className="h-7 w-24 bg-forest/8 rounded-lg" />
        <div className="h-7 w-24 bg-forest/5 rounded-full" />
      </nav>

      {/* Hero image */}
      <div className="mx-4 rounded-2xl bg-forest/5 aspect-[342/300]" />

      {/* Text lines */}
      <div className="px-4 pt-5 flex-1 space-y-3">
        <div className="h-3 w-40 bg-forest/5 rounded" />
        <div className="h-8 w-full bg-forest/8 rounded-lg" />
        <div className="h-8 w-3/4 bg-forest/8 rounded-lg" />
        <div className="space-y-2 pt-2">
          <div className="h-4 w-full bg-forest/5 rounded" />
          <div className="h-4 w-5/6 bg-forest/5 rounded" />
        </div>
      </div>

      {/* Countdown boxes */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center justify-center gap-2">
          <div className="h-3 w-32 bg-forest/5 rounded" />
          <div className="flex gap-1.5">
            <div className="w-14 h-14 rounded-xl bg-white" />
            <div className="w-14 h-14 rounded-xl bg-white" />
            <div className="w-14 h-14 rounded-xl bg-white" />
          </div>
        </div>
      </div>

      {/* CTA button */}
      <div className="px-4 pb-8 pt-4">
        <div className="h-14 w-full bg-forest/8 rounded-2xl" />
      </div>
    </main>
  );
}

export function DesktopDropPageSkeleton() {
  return (
    <main className="min-h-screen bg-cream flex flex-col gap-4 pb-12 animate-pulse">
      {/* Nav */}
      <nav className="max-w-[1280px] mx-auto w-full px-12 flex items-center justify-between py-5">
        <div className="h-8 w-32 bg-forest/8 rounded-lg" />
        <div className="h-7 w-24 bg-forest/5 rounded-full" />
      </nav>

      {/* Hero split */}
      <div className="max-w-[1280px] mx-auto w-full px-12">
        <div className="flex rounded-[28px] overflow-hidden min-h-[520px]">
          <div className="flex-1 flex flex-col justify-center p-12 gap-5 bg-white">
            <div className="h-3 w-32 bg-forest/5 rounded" />
            <div className="h-12 w-3/4 bg-forest/8 rounded-xl" />
            <div className="space-y-2">
              <div className="h-4 w-full max-w-[400px] bg-forest/5 rounded" />
              <div className="h-4 w-4/5 max-w-[320px] bg-forest/5 rounded" />
            </div>
            <div className="h-8 w-24 bg-forest/8 rounded-lg" />
            <div className="flex items-center gap-4 pt-2">
              <div className="h-12 w-36 bg-forest/8 rounded-2xl" />
              <div className="space-y-1.5">
                <div className="h-2.5 w-24 bg-forest/5 rounded" />
                <div className="h-4 w-20 bg-forest/5 rounded" />
              </div>
            </div>
          </div>
          <div className="flex-1 bg-forest/5" />
        </div>
      </div>

      {/* Marquee */}
      <div className="w-full h-12 bg-forest/8" />

      {/* How it works */}
      <div className="max-w-[1280px] mx-auto w-full px-12">
        <div className="flex gap-8 justify-center py-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3 w-48">
              <div className="w-14 h-14 rounded-full bg-forest/5" />
              <div className="h-5 w-32 bg-forest/8 rounded" />
              <div className="h-3 w-40 bg-forest/5 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom cards */}
      <div className="max-w-[1280px] mx-auto w-full px-12 flex gap-4">
        <div className="flex-1 h-56 rounded-[20px] bg-forest/5" />
        <div className="flex-1 h-56 rounded-[20px] bg-forest/5" />
      </div>

      {/* Footer */}
      <div className="max-w-[1280px] mx-auto w-full px-12">
        <div className="h-48 rounded-2xl bg-forest/8" />
      </div>
    </main>
  );
}

export function FlavorScreenSkeleton() {
  return (
    <main className="min-h-screen w-full max-w-lg mx-auto bg-cream animate-pulse">
      {/* Nav */}
      <nav className="flex items-center px-4 py-4">
        <div className="h-5 w-16 bg-forest/8 rounded" />
      </nav>

      {/* Header */}
      <div className="px-4 pt-2 pb-4 space-y-2">
        <div className="h-3 w-28 bg-forest/5 rounded" />
        <div className="h-8 w-48 bg-forest/8 rounded-lg" />
      </div>

      {/* Flavor card */}
      <div className="mx-4 rounded-2xl bg-white overflow-hidden">
        <div className="aspect-[342/180] bg-forest/5" />
        <div className="p-5 space-y-3">
          <div className="flex justify-between">
            <div className="h-5 w-32 bg-forest/8 rounded" />
            <div className="h-5 w-20 bg-forest/5 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-forest/5 rounded" />
            <div className="h-4 w-4/5 bg-forest/5 rounded" />
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex-1 h-1.5 bg-forest/5 rounded-full mr-4" />
            <div className="h-9 w-16 bg-forest/8 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Coming next week */}
      <div className="mx-4 mt-3 p-5 rounded-2xl bg-forest/5 space-y-2">
        <div className="h-3 w-28 bg-forest/8 rounded mx-auto" />
        <div className="h-6 w-40 bg-forest/8 rounded-lg mx-auto" />
        <div className="h-3 w-56 bg-forest/5 rounded mx-auto" />
      </div>

      {/* Meet Heidi */}
      <div className="mx-4 mt-3 mb-8 p-6 rounded-2xl bg-mint/50 flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-forest/8" />
        <div className="h-3 w-36 bg-forest/5 rounded" />
        <div className="h-6 w-28 bg-forest/8 rounded-lg" />
        <div className="space-y-2 w-full max-w-[280px]">
          <div className="h-4 w-full bg-forest/5 rounded" />
          <div className="h-4 w-5/6 bg-forest/5 rounded mx-auto" />
          <div className="h-4 w-4/5 bg-forest/5 rounded mx-auto" />
        </div>
      </div>
    </main>
  );
}

export function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-forest/5 rounded animate-pulse ${className}`} />
  );
}
