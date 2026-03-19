"use client";

import { useSwipeDismiss } from "@/hooks/use-swipe-dismiss";

const BAKING_EMOJIS = [
  "🍪", "🧁", "🎂", "🍰", "🥮", "🍩", "🥐", "🥯",
  "🍞", "🥖", "🧇", "🥞", "🍫", "🍬", "🍭", "🍮",
  "🧀", "🥧", "🍡", "🍢", "🍯", "🥜", "🌰", "🫐",
  "🍓", "🍒", "🍑", "🥝", "🍋", "🥥", "🍌", "🫚",
  "🧈", "🥛", "🥚", "🌿", "🍵", "🧪", "💡", "📝",
  "⭐", "🔥", "❤️", "✨", "🏆", "🎯", "🧑‍🍳", "🤤",
];

interface Props {
  current: string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ current, onSelect, onClose }: Props) {
  const { sheetRef, onTouchStart, onTouchMove, onTouchEnd } = useSwipeDismiss(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="relative w-full max-w-lg bg-cream rounded-t-2xl p-5 pb-8 animate-slide-up"
      >
        <div className="w-10 h-1 rounded-full bg-forest/10 mx-auto mb-4 cursor-grab" />
        <p className="text-[11px] font-semibold text-forest/35 uppercase tracking-wider mb-3">Choose an emoji</p>
        <div className="grid grid-cols-8 gap-1">
          {BAKING_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onSelect(emoji); onClose(); }}
              className={`w-full aspect-square rounded-xl flex items-center justify-center text-2xl btn-press transition ${
                current === emoji ? "bg-forest/10 ring-2 ring-forest/20" : "hover:bg-forest/5"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
