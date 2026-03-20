"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { MAX_ORDER_QUANTITY } from "@/lib/orders/constants";
import { PhoneInput } from "./shared/phone-input";
import { formatCents } from "@/lib/format";
import type { Drop } from "@/types/database";

interface OrderSheetProps {
  drop: Drop;
  remaining: number;
  onClose: () => void;
  onOrderComplete?: (result: {
    order_id: string;
    payment_link: string;
    expires_at: string;
    total_cents: number;
    quantity: number;
  }) => void;
}

type Step = "quantity" | "contact";

export function OrderSheet({ drop, remaining, onClose, onOrderComplete }: OrderSheetProps) {
  const [step, setStep] = useState<Step>("quantity");
  const [quantity, setQuantity] = useState(Math.min(3, Math.min(MAX_ORDER_QUANTITY, remaining)));
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Lock body scroll while sheet is open.
  // Instead of position:fixed on body (which shifts content and causes gaps),
  // we prevent scroll at the event level and hide overflow on html+body.
  useEffect(() => {
    const scrollY = window.scrollY;

    // Track touch start Y for scroll direction detection
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const preventScroll = (e: TouchEvent) => {
      const sheet = sheetRef.current;

      // Outside the sheet: always block
      if (!sheet || !sheet.contains(e.target as Node)) {
        e.preventDefault();
        return;
      }

      // Inside the sheet: prevent scroll chaining at boundaries (Chrome fix)
      const { scrollTop, scrollHeight, clientHeight } = sheet;
      const currentY = e.touches[0].clientY;
      const isScrollingUp = currentY > startY;
      const isScrollingDown = currentY < startY;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

      // Block if at boundary and trying to scroll past it
      if ((atTop && isScrollingUp) || (atBottom && isScrollingDown)) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });

    document.addEventListener("touchmove", preventScroll, { passive: false });

    // Hide overflow on both html and body for belt-and-suspenders iOS coverage
    const html = document.documentElement;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", preventScroll);
      html.style.overflow = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  const [closing, setClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);

  const currentDragY = useRef(0);

  const handleClose = useCallback(() => {
    if (!sheetRef.current) { onClose(); return; }
    const sheet = sheetRef.current;
    // Animate out: slide down on mobile, scale+fade on desktop
    sheet.style.transition = "transform 250ms ease-out, opacity 200ms ease-out";
    sheet.style.transform = window.innerWidth >= 1024 ? "scale(0.95)" : "translateY(100%)";
    sheet.style.opacity = window.innerWidth >= 1024 ? "0" : "1";
    setClosing(true);
    setTimeout(onClose, 250);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  function onTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY;
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (dragStartY.current === null || !sheetRef.current) return;
    const diff = e.touches[0].clientY - dragStartY.current;
    if (diff > 0) {
      currentDragY.current = diff;
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  }

  function onTouchEnd() {
    if (currentDragY.current > 100) {
      handleClose();
    } else if (sheetRef.current) {
      // Snap back
      sheetRef.current.style.transition = "transform 200ms ease-out";
      sheetRef.current.style.transform = "translateY(0)";
    }
    currentDragY.current = 0;
    dragStartY.current = null;
  }

  const maxQty = Math.min(MAX_ORDER_QUANTITY, remaining);
  const totalCents = drop.price_cents * quantity;
  const totalFormatted = formatCents(totalCents);

  async function handleSubmit() {
    if (!name.trim() || !whatsapp.trim()) {
      setError("Name and WhatsApp are required");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drop_id: drop.id,
          customer_name: name.trim(),
          customer_whatsapp: whatsapp.trim(),
          customer_email: email.trim() || undefined,
          quantity,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setError(
            data.remaining > 0
              ? `Only ${data.remaining} left. Reduce your quantity and try again.`
              : "This drop just hit capacity. No more orders can be placed."
          );
        } else if (res.status === 429) {
          const retryAfter = res.headers.get("Retry-After");
          const secs = retryAfter ? parseInt(retryAfter, 10) : 30;
          setError(
            `You're moving fast! Please wait ${secs} seconds and try again.`
          );
        } else {
          setError(data.error || "Something went wrong");
        }
        setLoading(false);
        return;
      }

      if (onOrderComplete) {
        onOrderComplete({ ...data, quantity });
        onClose();
      }
    } catch {
      setError("Connection error. Please try again.");
    }
    setLoading(false);
  }

  // Render via portal so the sheet is a direct child of document.body,
  // completely outside the app's DOM tree and unaffected by body transforms.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      style={{ touchAction: "none", overscrollBehavior: "none" }}
    >
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-250 ${closing ? "opacity-0" : ""}`}
        style={{ touchAction: "none" }}
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: "pan-y", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
        className="relative w-full max-w-lg lg:max-w-xl max-h-[80dvh] overflow-y-auto bg-cream rounded-t-3xl lg:rounded-3xl p-4 pb-10 lg:p-10 lg:pb-10 animate-slide-up lg:animate-scale-in shadow-[0_-8px_30px_rgba(0,0,0,0.12)] lg:shadow-2xl"
      >
        {/* Drag handle — mobile only */}
        <div className="flex justify-center mb-4 cursor-grab lg:hidden">
          <div className="w-9 h-1 rounded-full bg-forest/10" />
        </div>
        {/* Close button — desktop only */}
        <button
          onClick={handleClose}
          className="hidden lg:flex absolute top-6 right-6 w-6 h-6 items-center justify-center text-forest/25 hover:text-forest/50 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
          </svg>
        </button>

        {/* Step indicator (Goal-Gradient Effect) */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-[3px] rounded-full ${step === "quantity" ? "bg-forest" : "bg-forest"}`} />
            <div className={`w-6 h-[3px] rounded-full ${step === "contact" ? "bg-forest" : "bg-forest/12"}`} />
          </div>
          <span className="text-xs text-forest/35">Step {step === "quantity" ? "1" : "2"} of 2</span>
        </div>

        {step === "quantity" && (
          <>
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-display font-black text-2xl text-forest">
                Your order
              </h2>
              <span className="text-sm text-forest/40">Max {maxQty}</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-[#5C3D2E]/10 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-forest">{drop.flavor_name}</p>
                <p className="text-sm text-forest/50">
                  {formatCents(drop.price_cents)} each
                </p>
              </div>
              <div className="flex items-center gap-0 rounded-xl bg-forest overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 text-white text-lg font-bold hover:bg-white/10 btn-press"
                >
                  -
                </button>
                <span key={quantity} className="w-8 text-center text-white font-bold animate-count-pulse">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                  className="w-10 h-10 text-white text-lg font-bold hover:bg-white/10 btn-press"
                >
                  +
                </button>
              </div>
            </div>

            <div className="border-t border-forest/8 pt-4 mb-6">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-forest/60">
                  {quantity}x {drop.flavor_name}
                </span>
                <span className="text-sm font-semibold text-forest">
                  {totalFormatted}
                </span>
              </div>
              <div className="flex justify-between items-baseline mt-1">
                <span className="text-sm text-forest/40">
                  Baked fresh this Saturday
                </span>
              </div>
              <div className="flex justify-between items-baseline mt-3">
                <span className="font-semibold text-green-accent">
                  Total · {quantity} {quantity === 1 ? "treat" : "treats"}
                </span>
                <span className="font-display font-black text-xl text-forest">
                  {totalFormatted}
                </span>
              </div>
            </div>

            <button
              onClick={() => setStep("contact")}
              className="w-full py-4 rounded-2xl bg-forest text-white font-semibold text-base btn-press"
            >
              Continue to checkout
            </button>
            <p className="text-xs text-center text-forest/35 mt-3">
              You&apos;ll receive a payment link to confirm
            </p>
          </>
        )}

        {step === "contact" && (
          <>
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-display font-black text-2xl text-forest">
                Almost there
              </h2>
              <span className="text-sm text-forest/40">
                {quantity} treats · {totalFormatted}
              </span>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-forest/40 uppercase tracking-wider block mb-2">
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Andrea Lopez"
                  className="w-full px-4 py-3.5 rounded-xl bg-white text-forest placeholder:text-forest/25 outline-none focus:ring-2 focus:ring-forest/20"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-forest/40 uppercase tracking-wider block mb-2">
                  WhatsApp number
                </label>
                <PhoneInput
                  value={whatsapp}
                  onChange={setWhatsapp}
                  className="w-full"
                  bgClass="bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-forest/40 uppercase tracking-wider block mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="For order updates"
                  className="w-full px-4 py-3.5 rounded-xl bg-white text-forest placeholder:text-forest/25 outline-none focus:ring-2 focus:ring-forest/20"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-mint mb-6">
              <span className="text-sm font-semibold text-forest">
                Pickup Sunday at {drop.pickup_location}
              </span>
              <span className="text-xs text-forest/50">
                {drop.pickup_time_start.slice(0, 5)} PM
              </span>
            </div>

            {error && (
              <p className="text-sm text-red-text bg-red-soft px-4 py-2 rounded-xl mb-4">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-forest text-white font-semibold text-base disabled:opacity-50"
            >
              {loading ? "Reserving..." : "Reserve my treats"}
            </button>
            <p className="text-xs text-center text-forest/35 mt-3">
              We&apos;ll send a payment link to your WhatsApp. Pay within 2
              hours to confirm your order.
            </p>
          </>
        )}

      </div>
    </div>,
    document.body
  );
}
