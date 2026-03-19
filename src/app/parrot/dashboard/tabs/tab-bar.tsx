"use client";

export type Tab = "home" | "orders" | "lab" | "drops";

interface TabBarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  const tabs: { id: Tab; label: string; icon: (filled: boolean) => React.ReactNode }[] = [
    {
      id: "home",
      label: "Home",
      icon: (filled) =>
        filled ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 7.5L10 2l7 5.5V17a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 17V7.5z" fill="#1B3D2F" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 7.5L10 2l7 5.5V17a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 17V7.5z" stroke="#1B3D2F" strokeWidth="1.3" opacity="0.3" />
          </svg>
        ),
    },
    {
      id: "orders",
      label: "Orders",
      icon: (filled) =>
        filled ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="3.5" width="16" height="13" rx="2" fill="#1B3D2F" />
            <path d="M2 7.5h16" stroke="#FBF8F4" strokeWidth="1.3" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="3.5" width="16" height="13" rx="2" stroke="#1B3D2F" strokeWidth="1.3" opacity="0.3" />
            <path d="M2 7.5h16" stroke="#1B3D2F" strokeWidth="1.3" opacity="0.3" />
          </svg>
        ),
    },
    {
      id: "lab",
      label: "Lab",
      icon: (filled) =>
        filled ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5" fill="#1B3D2F" />
            <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.5" fill="#1B3D2F" />
            <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5" fill="#1B3D2F" />
            <rect x="11" y="11" width="6.5" height="6.5" rx="1.5" fill="#1B3D2F" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5" stroke="#1B3D2F" strokeWidth="1.3" opacity="0.3" />
            <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.5" stroke="#1B3D2F" strokeWidth="1.3" opacity="0.3" />
            <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5" stroke="#1B3D2F" strokeWidth="1.3" opacity="0.3" />
            <rect x="11" y="11" width="6.5" height="6.5" rx="1.5" stroke="#1B3D2F" strokeWidth="1.3" opacity="0.3" />
          </svg>
        ),
    },
    {
      id: "drops",
      label: "Drops",
      icon: (filled) =>
        filled ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7.5" fill="#1B3D2F" />
            <path d="M10 5.5v4.5l3 2" stroke="#FBF8F4" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7.5" stroke="#1B3D2F" strokeWidth="1.3" opacity="0.3" />
            <path d="M10 5.5v4.5l3 2" stroke="#1B3D2F" strokeWidth="1.3" strokeLinecap="round" opacity="0.3" />
          </svg>
        ),
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-around bg-white border-t border-forest/6 px-4 pt-2.5 pb-7">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="flex flex-col items-center gap-1 btn-press"
        >
          {tab.icon(active === tab.id)}
          <span
            className={`text-[10px] ${
              active === tab.id
                ? "font-semibold text-forest"
                : "font-medium text-forest/35"
            }`}
          >
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
