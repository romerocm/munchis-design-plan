"use client";

import { useState, useMemo } from "react";
import { WheelPicker } from "./wheel-picker";

interface TimeWheelPickerProps {
  value: string; // "HH:MM" or "HH:MM:SS"
  onConfirm: (value: string) => void;
  onClose: () => void;
  label?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

export function TimeWheelPicker({ value, onConfirm, onClose, label }: TimeWheelPickerProps) {
  const [h, m] = useMemo(() => {
    const match = value.match(/^(\d{2}):(\d{2})/);
    if (match) return [match[1], match[2]];
    return ["12", "00"];
  }, [value]);

  // Snap initial minute to nearest 5
  const snappedM = useMemo(() => {
    const n = parseInt(m);
    const snapped = Math.round(n / 5) * 5;
    return String(snapped % 60).padStart(2, "0");
  }, [m]);

  const [hour, setHour] = useState(h);
  const [minute, setMinute] = useState(snappedM);

  function handleChange(colIndex: number, val: string) {
    if (colIndex === 0) setHour(val);
    else setMinute(val);
  }

  function handleConfirm() {
    onConfirm(`${hour}:${minute}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-white rounded-t-3xl lg:rounded-3xl pb-8 pt-4 px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4 lg:hidden">
          <div className="w-10 h-1 rounded-full bg-forest/15" />
        </div>

        {label && (
          <p className="text-sm font-semibold text-forest/60 text-center mb-4">{label}</p>
        )}

        <WheelPicker
          columns={[
            { values: HOURS, selected: hour, width: 80 },
            { values: MINUTES, selected: minute, width: 80 },
          ]}
          onChange={handleChange}
        />

        <button
          onClick={handleConfirm}
          className="w-full mt-4 py-3 rounded-xl bg-forest text-white font-semibold text-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
}
