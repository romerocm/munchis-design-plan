import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DropDetail } from "@/app/parrot/dashboard/drop-detail";
import { makeLiveDrop, makeCompletedDrop } from "../fixtures/drops";
import { makeConfirmedOrder, makeOrder } from "../fixtures/orders";

describe("DropDetail", () => {
  const onBack = vi.fn();
  const onEdit = vi.fn();

  function renderDetail(overrides: { drop?: ReturnType<typeof makeLiveDrop>; orders?: ReturnType<typeof makeOrder>[] } = {}) {
    const drop = overrides.drop ?? makeLiveDrop({ id: "drop-1", flavor_name: "Cinnamon Rolls", number: 7, price_cents: 450, capacity: 100 });
    const orders = overrides.orders ?? [
      makeConfirmedOrder({ id: "o1", drop_id: "drop-1", quantity: 5, total_cents: 2250 }),
      makeConfirmedOrder({ id: "o2", drop_id: "drop-1", quantity: 3, total_cents: 1350 }),
      makeOrder({ id: "o3", drop_id: "drop-1", quantity: 2, total_cents: 900 }), // pending
    ];
    return render(<DropDetail drop={drop} orders={orders} onBack={onBack} onEdit={onEdit} />);
  }

  it("renders drop name and number", () => {
    renderDetail();
    expect(screen.getByText("Cinnamon Rolls")).toBeInTheDocument();
    expect(screen.getByText(/Drop #07/)).toBeInTheDocument();
  });

  it("shows stats grid with orders, treats, revenue, capacity", () => {
    renderDetail();
    // 2 confirmed orders
    expect(screen.getByText("2")).toBeInTheDocument(); // Orders count
    // 5 + 3 = 8 treats
    expect(screen.getByText("8")).toBeInTheDocument();
    // Revenue: $22.50 + $13.50 = $36 (formatCents with 0 decimals)
    expect(screen.getByText("$36")).toBeInTheDocument();
    // Capacity: (5+3+2)/100 = 10%
    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.getByText("10/100 capacity")).toBeInTheDocument();
  });

  it("shows price per treat", () => {
    renderDetail();
    expect(screen.getByText("$4.50")).toBeInTheDocument();
    expect(screen.getByText("per treat")).toBeInTheDocument();
  });

  it("shows pickup location", () => {
    renderDetail();
    expect(screen.getByText("Multiplaza")).toBeInTheDocument();
    expect(screen.getByText("pickup")).toBeInTheDocument();
  });

  it("shows schedule timeline", () => {
    renderDetail();
    expect(screen.getByText("Schedule")).toBeInTheDocument();
    expect(screen.getByText("Orders open")).toBeInTheDocument();
    expect(screen.getByText("Orders close")).toBeInTheDocument();
    expect(screen.getByText("Pickup")).toBeInTheDocument();
  });

  it("shows orders list with customer info", () => {
    renderDetail();
    expect(screen.getAllByText("Orders").length).toBeGreaterThanOrEqual(2); // stats grid + section heading
    expect(screen.getByText("3 total")).toBeInTheDocument();
    // Customer name from fixture
    expect(screen.getAllByText("Maria Alejandra").length).toBeGreaterThan(0);
  });

  it("shows order status badges", () => {
    renderDetail();
    // 2 confirmed (shown as "Paid") + 1 pending
    expect(screen.getAllByText("Paid").length).toBe(2);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("shows empty orders state for drop with no orders", () => {
    const drop = makeLiveDrop({ id: "drop-empty", flavor_name: "Empty Drop" });
    renderDetail({ drop, orders: [] });
    expect(screen.getByText("No orders")).toBeInTheDocument();
    expect(screen.getByText("Orders will show up here.")).toBeInTheDocument();
  });

  it("shows completed empty state message", () => {
    const drop = makeCompletedDrop({ id: "drop-done", flavor_name: "Done Drop" });
    renderDetail({ drop, orders: [] });
    expect(screen.getByText("This drop had no orders.")).toBeInTheDocument();
  });

  it("shows status pill with drop status", () => {
    renderDetail();
    // Status pill shows the raw status text
    expect(screen.getByText("live")).toBeInTheDocument();
  });

  it("back button calls onBack", () => {
    renderDetail();
    const backButton = screen.getByText("Drops");
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalled();
  });

  it("edit button calls onEdit", () => {
    renderDetail();
    const editButton = screen.getByText("Edit");
    fireEvent.click(editButton);
    expect(onEdit).toHaveBeenCalled();
  });

  it("shows 'No image' when no hero or flavor image", () => {
    const drop = makeLiveDrop({ id: "drop-noimg", hero_image_url: null, flavor_image_url: null });
    renderDetail({ drop });
    expect(screen.getByText("No image")).toBeInTheDocument();
  });
});
