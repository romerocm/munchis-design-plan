import type { DropBakingStep } from "@/types/database";

let counter = 0;

export function makeBakingStep(overrides: Partial<DropBakingStep> = {}): DropBakingStep {
  counter++;
  return {
    id: `baking-step-${counter}-${Date.now()}`,
    drop_id: "drop-1",
    step_number: counter,
    title: "Preheat oven",
    description: "Preheat to 175°C (350°F)",
    duration_min: 10,
    is_timer_step: true,
    status: "pending",
    started_at: null,
    completed_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
