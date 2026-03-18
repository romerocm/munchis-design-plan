"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface WheelColumn {
  values: string[];
  selected: string;
  width?: number;
}

interface WheelPickerProps {
  columns: WheelColumn[];
  onChange: (columnIndex: number, value: string) => void;
}

const ITEM_HEIGHT = 40;
const VISIBLE = 5;
const PADDING = Math.floor(VISIBLE / 2);

function Column({
  values,
  selected,
  width,
  onChange,
}: {
  values: string[];
  selected: string;
  width?: number;
  onChange: (value: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const isMountedRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, values.indexOf(selected)));
  const [popping, setPopping] = useState(false);
  const prevActiveRef = useRef(activeIndex);

  // Scroll to initial position on mount (no animation)
  useEffect(() => {
    if (!ref.current) return;
    const idx = Math.max(0, values.indexOf(selected));
    ref.current.scrollTop = idx * ITEM_HEIGHT;
    setActiveIndex(idx);
    // Small delay to mark mounted (prevents handleScroll from firing during initial scroll)
    requestAnimationFrame(() => { isMountedRef.current = true; });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Micro-interaction: brief scale pop when selection changes
  useEffect(() => {
    if (!isMountedRef.current) return;
    if (activeIndex !== prevActiveRef.current) {
      prevActiveRef.current = activeIndex;
      setPopping(true);
      const t = setTimeout(() => setPopping(false), 180);
      return () => clearTimeout(t);
    }
  }, [activeIndex]);

  // When `values` array changes (e.g. days in month), re-scroll to active
  useEffect(() => {
    if (!isMountedRef.current || !ref.current) return;
    const clamped = Math.min(activeIndex, values.length - 1);
    if (clamped !== activeIndex) setActiveIndex(clamped);
    ref.current.scrollTop = clamped * ITEM_HEIGHT;
  }, [values.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = useCallback(() => {
    if (!isMountedRef.current || !ref.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!ref.current) return;
      const rawIndex = ref.current.scrollTop / ITEM_HEIGHT;
      const index = Math.round(rawIndex);
      const clamped = Math.max(0, Math.min(index, values.length - 1));

      // Snap to nearest item
      ref.current.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: "smooth" });
      setActiveIndex(clamped);

      if (values[clamped] !== selected) {
        onChange(values[clamped]);
      }
    }, 120);
  }, [values, selected, onChange]);

  return (
    <div className="relative" style={{ width: width || 80, height: ITEM_HEIGHT * VISIBLE }}>
      {/* Selection highlight bar */}
      <div
        className="absolute left-0 right-0 bg-forest/6 rounded-lg pointer-events-none z-0"
        style={{ top: PADDING * ITEM_HEIGHT, height: ITEM_HEIGHT }}
      />

      {/* Scroll container — NO CSS scroll-snap, JS handles snapping */}
      <div
        ref={ref}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto scrollbar-hide z-10"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Top padding so first item can center */}
        <div style={{ height: PADDING * ITEM_HEIGHT }} />

        {values.map((value, i) => (
          <div
            key={value}
            className="flex items-center justify-center select-none"
            style={{ height: ITEM_HEIGHT }}
          >
            <span
              className={`text-base transition-all duration-150 ${
                i === activeIndex
                  ? "font-bold text-forest"
                  : Math.abs(i - activeIndex) === 1
                  ? "font-medium text-forest/40"
                  : "font-medium text-forest/20"
              }`}
              style={
                i === activeIndex && popping
                  ? { transform: "scale(1.18)", transition: "transform 100ms cubic-bezier(0.34, 1.56, 0.64, 1)" }
                  : i === activeIndex
                  ? { transform: "scale(1)", transition: "transform 180ms ease-out" }
                  : undefined
              }
            >
              {value}
            </span>
          </div>
        ))}

        {/* Bottom padding so last item can center */}
        <div style={{ height: PADDING * ITEM_HEIGHT }} />
      </div>

      {/* Fade edges */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white to-transparent pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none z-20" />
    </div>
  );
}

export function WheelPicker({ columns, onChange }: WheelPickerProps) {
  return (
    <div className="flex items-center justify-center gap-1 bg-white rounded-2xl p-3">
      {columns.map((col, i) => (
        <Column
          key={`${i}-${col.values.length}`}
          values={col.values}
          selected={col.selected}
          width={col.width}
          onChange={(value) => onChange(i, value)}
        />
      ))}
    </div>
  );
}
