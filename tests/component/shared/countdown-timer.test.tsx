import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CountdownTimer } from "@/components/shared/countdown-timer";

describe("CountdownTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders without crashing and shows time units", () => {
    vi.setSystemTime(new Date("2026-03-18T12:00:00.000Z"));
    const future = "2026-03-19T12:00:00.000Z";
    const { container } = render(<CountdownTimer targetDate={future} />);
    const text = container.textContent || "";
    // Component should render time unit labels
    expect(text).toContain("Days");
    expect(text).toContain("Hrs");
    expect(text).toContain("Min");
    expect(text).toContain("Sec");
  });

  it("shows time values after effect runs", () => {
    // Set now to a fixed time
    vi.setSystemTime(new Date("2026-03-18T12:00:00.000Z"));

    const target = "2026-03-19T12:00:00.000Z"; // exactly 1 day away
    render(<CountdownTimer targetDate={target} />);

    // Trigger the useEffect
    act(() => {
      vi.advanceTimersByTime(0);
    });

    // Should show "Days", "Hrs", "Min", "Sec" labels
    expect(screen.getByText("Days")).toBeInTheDocument();
    expect(screen.getByText("Hrs")).toBeInTheDocument();
    expect(screen.getByText("Min")).toBeInTheDocument();
    expect(screen.getByText("Sec")).toBeInTheDocument();

    // Should show "1" for days
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows 'Orders are closed' when target is in the past", () => {
    vi.setSystemTime(new Date("2026-03-18T12:00:00.000Z"));

    const past = "2026-03-17T12:00:00.000Z";
    render(<CountdownTimer targetDate={past} />);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByText("Orders are closed")).toBeInTheDocument();
  });

  it("renders compact mode", () => {
    vi.setSystemTime(new Date("2026-03-18T12:00:00.000Z"));

    const target = "2026-03-19T14:30:45.000Z"; // ~1d 2h 30m 45s
    render(<CountdownTimer targetDate={target} compact />);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    // Compact mode shows inline text like "1d 2h 30m 45s left"
    const text = screen.getByText(/\d+d \d+h \d+m \d+s left/);
    expect(text).toBeInTheDocument();
  });

  it("renders compact placeholder on initial mount", () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const { container } = render(<CountdownTimer targetDate={future} compact />);
    // Compact placeholder is a &nbsp; span
    const span = container.querySelector("span");
    expect(span).toBeInTheDocument();
  });

  it("updates every second", () => {
    vi.setSystemTime(new Date("2026-03-18T12:00:00.000Z"));

    const target = "2026-03-18T12:00:10.000Z"; // 10 seconds away
    render(<CountdownTimer targetDate={target} compact />);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByText(/10s left/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText(/9s left/)).toBeInTheDocument();
  });

  it("transitions to expired state when countdown reaches zero", () => {
    vi.setSystemTime(new Date("2026-03-18T12:00:00.000Z"));

    const target = "2026-03-18T12:00:02.000Z"; // 2 seconds away
    render(<CountdownTimer targetDate={target} />);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    // Should not be expired yet
    expect(screen.queryByText("Orders are closed")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText("Orders are closed")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    vi.setSystemTime(new Date("2026-03-18T12:00:00.000Z"));

    const target = "2026-03-19T12:00:00.000Z";
    render(<CountdownTimer targetDate={target} label="Orders open in" />);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByText("Orders open in")).toBeInTheDocument();
  });
});
