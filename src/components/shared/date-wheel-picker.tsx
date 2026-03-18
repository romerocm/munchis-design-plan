"use client";

import { useState, useMemo } from "react";
import { WheelPicker } from "./wheel-picker";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface DateWheelPickerProps {
  value: string; // "YYYY-MM-DD"
  onConfirm: (value: string) => void;
  onClose: () => void;
  label?: string;
}

export function DateWheelPicker({ value, onConfirm, onClose, label }: DateWheelPickerProps) {
  const [y, m, d] = useMemo(() => {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return [+match[1], +match[2], +match[3]];
    const now = new Date();
    return [now.getFullYear(), now.getMonth() + 1, now.getDate()];
  }, [value]);

  const [year, setYear] = useState(y);
  const [month, setMonth] = useState(m);
  const [day, setDay] = useState(d);

  const years = useMemo(() => {
    const curr = new Date().getFullYear();
    return Array.from({ length: 3 }, (_, i) => String(curr + i));
  }, []);

  const weekday = DAYS_OF_WEEK[new Date(year, month - 1, day).getDay()];
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));

  function handleChange(colIndex: number, val: string) {
    let newY = year, newM = month, newD = day;

    if (colIndex === 0) {
      newD = parseInt(val);
    } else if (colIndex === 1) {
      newM = MONTHS.indexOf(val) + 1;
    } else {
      newY = parseInt(val);
    }

    const maxDay = new Date(newY, newM, 0).getDate();
    if (newD > maxDay) newD = maxDay;

    setYear(newY);
    setMonth(newM);
    setDay(newD);
  }

  function handleConfirm() {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onConfirm(dateStr);
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
          <p className="text-sm font-semibold text-forest/60 text-center mb-2">{label}</p>
        )}

        <p className="text-center mb-4">
          <span className="font-display font-black text-2xl text-forest transition-all duration-200">{weekday}</span>
        </p>

        <WheelPicker
          columns={[
            { values: days, selected: String(day).padStart(2, "0"), width: 70 },
            { values: MONTHS, selected: MONTHS[month - 1], width: 80 },
            { values: years, selected: String(year), width: 80 },
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
