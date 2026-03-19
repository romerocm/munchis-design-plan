"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDropNumber } from "@/lib/drops/constants";
import type { DropBakingStep, Drop } from "@/types/database";

interface Props {
  dropId: string;
  drop: Drop;
  getToken: () => Promise<string | null>;
  onBack: () => void;
  onSwitchToShopping: () => void;
  onViewRecipe: (recipeId: string) => void;
  onUpdateStatus: (dropId: string, status: string) => Promise<void>;
}

export function BakingPlan({ dropId, drop, getToken, onBack, onSwitchToShopping, onViewRecipe, onUpdateStatus }: Props) {
  const [steps, setSteps] = useState<DropBakingStep[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSteps = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch(`/api/parrot/drops/${dropId}/baking`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const { steps: data } = await res.json();
      setSteps(data);
    }
    setLoading(false);
  }, [dropId, getToken]);

  useEffect(() => { fetchSteps(); }, [fetchSteps]);

  async function updateStep(stepId: string, status: string) {
    const token = await getToken();
    if (!token) return;

    // Auto-transition drop to "baking" when baker starts working on steps
    if (drop.status === "closed") {
      await onUpdateStatus(dropId, "baking");
    }

    // Optimistic update
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? { ...s, status: status as DropBakingStep["status"], started_at: status === "active" ? new Date().toISOString() : s.started_at, completed_at: status === "completed" ? new Date().toISOString() : s.completed_at }
          : s
      )
    );

    await fetch(`/api/parrot/drops/${dropId}/baking`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stepId, status }),
    });
  }

  const completed = steps.filter((s) => s.status === "completed" || s.status === "skipped");
  const activeStep = steps.find((s) => s.status === "active");
  const upcoming = steps.filter((s) => s.status === "pending");
  const allDone = steps.length > 0 && completed.length === steps.length;

  // Time remaining estimate
  const remainingMin = [...(activeStep ? [activeStep] : []), ...upcoming].reduce(
    (sum, s) => sum + (s.duration_min || 0), 0
  );

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }

  if (loading) {
    return (
      <div className="pb-8">
        {/* Nav skeleton */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="h-4 w-24 bg-forest/5 rounded animate-pulse" />
          <div className="h-4 w-20 bg-forest/5 rounded animate-pulse" />
        </div>
        {/* Tabs */}
        <div className="flex border-b border-forest/8 mx-4">
          <div className="flex-1 pb-2 flex justify-center"><div className="h-4 w-16 bg-forest/5 rounded animate-pulse" /></div>
          <div className="flex-1 pb-2 flex justify-center"><div className="h-4 w-14 bg-forest/5 rounded animate-pulse" /></div>
        </div>
        {/* Title + status */}
        <div className="px-4 mt-4">
          <div className="h-8 w-36 bg-forest/5 rounded animate-pulse" />
          <div className="h-4 w-28 bg-forest/5 rounded animate-pulse mt-1.5" />
          <div className="h-6 w-24 bg-forest/5 rounded-full animate-pulse mt-2" />
        </div>
        {/* Timeline steps */}
        <div className="px-4 mt-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-3 mb-5">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-forest/5 animate-pulse" />
                {i < 4 && <div className="w-0.5 h-8 bg-forest/5 animate-pulse mt-1" />}
              </div>
              <div className="flex-1 pt-1">
                <div className="h-4 w-32 bg-forest/5 rounded animate-pulse" />
                <div className="h-3 w-48 bg-forest/5 rounded animate-pulse mt-1.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Nav */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-forest/50 text-sm btn-press">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Drop {formatDropNumber(drop.number)}
        </button>
        {drop.recipe_id && (
          <button onClick={() => onViewRecipe(drop.recipe_id!)} className="text-amber text-sm font-medium btn-press">
            View recipe
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-forest/8 mx-4">
        <button
          onClick={onSwitchToShopping}
          className="flex-1 pb-2 text-sm font-medium text-center text-forest/35"
        >
          Shopping
        </button>
        <button
          className="flex-1 pb-2 text-sm font-medium text-center text-forest border-b-2 border-forest"
        >
          Baking
        </button>
      </div>

      {/* Title */}
      <div className="px-4 mt-4">
        <h1 className="font-display font-black text-2xl text-forest">Baking Plan</h1>
        <p className="text-[13px] text-forest/45 mt-0.5">{drop.flavor_name}</p>
        {!allDone && steps.length > 0 && (
          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber/15 text-[12px] font-semibold text-amber">
              <div className="w-1.5 h-1.5 rounded-full bg-amber" />
              In progress
            </span>
            {remainingMin > 0 && (
              <span className="text-[13px] text-forest/45">~{remainingMin} min left</span>
            )}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="px-4 mt-5">
        {steps.map((step, i) => {
          const isDone = step.status === "completed" || step.status === "skipped";
          const isActive = step.status === "active";
          const isPending = step.status === "pending";

          return (
            <div key={step.id} className="flex gap-3">
              {/* Timeline line + circle */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDone ? "bg-forest" : isActive ? "bg-amber" : "bg-forest/10"
                }`}>
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M4 7.5L6 9.5L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span className={`text-[11px] font-bold ${isActive ? "text-white" : "text-forest/30"}`}>
                      {step.step_number}
                    </span>
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-0.5 flex-1 min-h-[16px] ${isDone ? "bg-forest/30" : "bg-forest/8"}`} />
                )}
              </div>

              {/* Content */}
              {isActive ? (
                <div className="flex-1 mb-4 p-4 rounded-xl bg-white border-2 border-amber/40 shadow-sm">
                  <div className="flex items-start justify-between">
                    <p className="text-[15px] font-semibold text-forest">{step.title}</p>
                    <span className="px-2 py-0.5 rounded-full bg-amber/15 text-[10px] font-semibold text-amber uppercase">Now</span>
                  </div>
                  {step.description && (
                    <p className="text-[13px] text-forest/50 mt-1 leading-relaxed">{step.description}</p>
                  )}
                  <p className="text-[12px] text-amber font-medium mt-2">
                    {step.duration_min && `${step.duration_min} min`}
                    {step.started_at && ` · Started ${formatTime(step.started_at)}`}
                  </p>
                  <button
                    onClick={() => updateStep(step.id, "completed")}
                    className="w-full mt-3 py-3 rounded-xl bg-forest text-white text-sm font-semibold btn-press"
                  >
                    Mark step done
                  </button>
                </div>
              ) : isDone ? (
                <button
                  onClick={() => updateStep(step.id, "pending")}
                  className="flex-1 mb-3 py-2 text-left btn-press group"
                >
                  <p className="text-[14px] font-medium text-forest/50 line-through group-hover:text-forest/70 transition">
                    {step.title}
                  </p>
                  <p className="text-[12px] text-forest/30">
                    {step.duration_min && `${step.duration_min} min`}
                    {step.completed_at && ` · Done ${formatTime(step.completed_at)}`}
                    <span className="ml-1 opacity-0 group-hover:opacity-100 transition text-forest/40"> · Tap to undo</span>
                  </p>
                </button>
              ) : (
                <div className="flex-1 mb-3 py-2">
                  <p className="text-[14px] font-medium text-forest/40">
                    {step.title}
                  </p>
                  <p className="text-[12px] text-forest/30">
                    {step.duration_min && `${step.duration_min} min`}
                  </p>
                  {/* Start button for first pending step (when no active step exists) */}
                  {isPending && !activeStep && i === completed.length && (
                    <button
                      onClick={() => updateStep(step.id, "active")}
                      className="mt-2 px-4 py-2 rounded-lg bg-forest text-white text-sm font-medium btn-press"
                    >
                      Start this step
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion CTA */}
      {allDone && (
        <div className="mx-4 mt-4 p-5 rounded-2xl bg-mint/40 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-forest/8 flex items-center justify-center mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#1B3D2F" strokeWidth="1.5" opacity="0.4" />
              <path d="M8 12l3 3 5-5" stroke="#1B3D2F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
            </svg>
          </div>
          <p className="font-display font-black text-lg text-forest">All steps complete!</p>
          <p className="text-[13px] text-forest/45 mt-1">Mark the drop as ready for pickup.</p>
          <button
            onClick={() => onUpdateStatus(dropId, "ready")}
            className="mt-4 w-full py-3 rounded-xl bg-forest text-white text-sm font-semibold btn-press flex items-center justify-center gap-2"
          >
            Mark drop as ready
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* Empty state */}
      {steps.length === 0 && (
        <div className="mt-10 flex flex-col items-center text-center px-6">
          <p className="font-display font-black text-lg text-forest">No baking plan</p>
          <p className="text-[13px] text-forest/40 mt-1">
            Link a recipe with steps to this drop to auto-generate a baking plan.
          </p>
        </div>
      )}
    </div>
  );
}
