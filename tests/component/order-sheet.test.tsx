import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { OrderSheet } from "@/components/order-sheet";
import { LanguageProvider } from "@/lib/i18n/context";
import { makeLiveDrop } from "../fixtures/drops";

// Mock createPortal to render inline instead of into document.body
vi.mock("react-dom", async () => {
  const actual = await vi.importActual("react-dom");
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

describe("OrderSheet", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  const onClose = vi.fn();
  const onOrderComplete = vi.fn();
  const drop = makeLiveDrop({ flavor_name: "Chocolate Chip", price_cents: 370 });

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
    onClose.mockClear();
    onOrderComplete.mockClear();
  });

  function renderSheet(overrides: { remaining?: number } = {}) {
    return render(
      <LanguageProvider>
        <OrderSheet
          drop={drop}
          remaining={overrides.remaining ?? 50}
          onClose={onClose}
          onOrderComplete={onOrderComplete}
        />
      </LanguageProvider>
    );
  }

  describe("Step 1: Quantity", () => {
    it("renders flavor name and price", () => {
      renderSheet();
      expect(screen.getByText("Chocolate Chip")).toBeInTheDocument();
      expect(screen.getByText("$3.70 each")).toBeInTheDocument();
    });

    it("shows step indicator", () => {
      renderSheet();
      expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    });

    it("default quantity is min(3, remaining)", () => {
      renderSheet({ remaining: 2 });
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("shows max quantity hint", () => {
      renderSheet({ remaining: 50 });
      expect(screen.getByText("Max 12")).toBeInTheDocument();
    });

    it("+ button increases quantity", () => {
      renderSheet();
      const plusBtn = screen.getByText("+");
      fireEvent.click(plusBtn);
      // Default is 3, should now be 4
      expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("- button decreases quantity", () => {
      renderSheet();
      const minusBtn = screen.getByText("-");
      fireEvent.click(minusBtn);
      // Default is 3, should now be 2
      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("cannot go below 1", () => {
      renderSheet({ remaining: 1 });
      const minusBtn = screen.getByText("-");
      fireEvent.click(minusBtn);
      fireEvent.click(minusBtn);
      // Should still show 1
      expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    });

    it("cannot exceed max quantity", () => {
      renderSheet({ remaining: 50 });
      const plusBtn = screen.getByText("+");
      // Click 20 times — should cap at 12
      for (let i = 0; i < 20; i++) fireEvent.click(plusBtn);
      expect(screen.getByText("12")).toBeInTheDocument();
    });

    it("cannot exceed remaining capacity", () => {
      renderSheet({ remaining: 5 });
      expect(screen.getByText("Max 5")).toBeInTheDocument();
      const plusBtn = screen.getByText("+");
      for (let i = 0; i < 10; i++) fireEvent.click(plusBtn);
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("shows total price", () => {
      renderSheet();
      // Default qty=3, price=370 cents → $11.10 (appears in line item + total)
      const totals = screen.getAllByText("$11.10");
      expect(totals.length).toBeGreaterThanOrEqual(2);
    });

    it("Continue button advances to step 2", () => {
      renderSheet();
      fireEvent.click(screen.getByText("Continue to checkout"));
      expect(screen.getByText("Almost there")).toBeInTheDocument();
      expect(screen.getByText("Step 2 of 2")).toBeInTheDocument();
    });
  });

  describe("Step 2: Contact", () => {
    function goToStep2(remaining = 50) {
      renderSheet({ remaining });
      fireEvent.click(screen.getByText("Continue to checkout"));
    }

    it("shows name and whatsapp fields", () => {
      goToStep2();
      expect(screen.getByPlaceholderText("Andrea Lopez")).toBeInTheDocument();
      expect(screen.getByText("+503")).toBeInTheDocument();
    });

    it("shows quantity summary", () => {
      goToStep2();
      expect(screen.getByText(/3 treats/)).toBeInTheDocument();
    });

    it("shows pickup info", () => {
      goToStep2();
      expect(screen.getByText(/Multiplaza/)).toBeInTheDocument();
    });

    it("shows error when name is empty", async () => {
      goToStep2();
      fireEvent.click(screen.getByText("Reserve my treats"));
      expect(screen.getByText("Name and WhatsApp are required")).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("submits order successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          order_id: "order-1",
          payment_link: "https://pay.test/1",
          expires_at: new Date(Date.now() + 1200000).toISOString(),
          total_cents: 1110,
        }),
      });

      goToStep2();

      // Fill in name
      fireEvent.change(screen.getByPlaceholderText("Andrea Lopez"), {
        target: { value: "Maria" },
      });

      // Fill in phone
      const phoneInput = screen.getByPlaceholderText("7890 1234");
      fireEvent.change(phoneInput, { target: { value: "78901234" } });

      // Submit
      fireEvent.click(screen.getByText("Reserve my treats"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/orders", expect.objectContaining({
          method: "POST",
        }));
      });

      await waitFor(() => {
        expect(onOrderComplete).toHaveBeenCalledWith(expect.objectContaining({
          order_id: "order-1",
          quantity: 3,
        }));
      });
    });

    it("handles 409 capacity error with remaining count", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ remaining: 2, error: "Not enough capacity" }),
      });

      goToStep2();

      fireEvent.change(screen.getByPlaceholderText("Andrea Lopez"), {
        target: { value: "Maria" },
      });
      const phoneInput = screen.getByPlaceholderText("7890 1234");
      fireEvent.change(phoneInput, { target: { value: "78901234" } });

      fireEvent.click(screen.getByText("Reserve my treats"));

      await waitFor(() => {
        expect(screen.getByText(/Only 2 left/)).toBeInTheDocument();
      });
    });

    it("handles 409 with zero remaining (sold out)", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ remaining: 0, error: "Sold out" }),
      });

      goToStep2();

      fireEvent.change(screen.getByPlaceholderText("Andrea Lopez"), {
        target: { value: "Maria" },
      });
      const phoneInput = screen.getByPlaceholderText("7890 1234");
      fireEvent.change(phoneInput, { target: { value: "78901234" } });

      fireEvent.click(screen.getByText("Reserve my treats"));

      await waitFor(() => {
        expect(screen.getByText(/hit capacity/)).toBeInTheDocument();
      });
    });

    it("handles network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      goToStep2();

      fireEvent.change(screen.getByPlaceholderText("Andrea Lopez"), {
        target: { value: "Maria" },
      });
      const phoneInput = screen.getByPlaceholderText("7890 1234");
      fireEvent.change(phoneInput, { target: { value: "78901234" } });

      fireEvent.click(screen.getByText("Reserve my treats"));

      await waitFor(() => {
        expect(screen.getByText("Connection error. Please try again.")).toBeInTheDocument();
      });
    });

    it("shows loading state while submitting", async () => {
      let resolvePromise: (value: unknown) => void;
      mockFetch.mockReturnValueOnce(new Promise((r) => { resolvePromise = r; }));

      goToStep2();

      fireEvent.change(screen.getByPlaceholderText("Andrea Lopez"), {
        target: { value: "Maria" },
      });
      const phoneInput = screen.getByPlaceholderText("7890 1234");
      fireEvent.change(phoneInput, { target: { value: "78901234" } });

      fireEvent.click(screen.getByText("Reserve my treats"));

      expect(screen.getByText("Reserving...")).toBeInTheDocument();

      resolvePromise!({
        ok: true,
        json: () => Promise.resolve({ order_id: "order-1", payment_link: "x", expires_at: "x", total_cents: 1110 }),
      });
    });
  });

  describe("Close behavior", () => {
    it("closes on Escape key", async () => {
      vi.useFakeTimers();
      renderSheet();
      fireEvent.keyDown(document, { key: "Escape" });
      // handleClose uses setTimeout(onClose, 250) for animation
      vi.advanceTimersByTime(300);
      expect(onClose).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it("closes on backdrop click", async () => {
      vi.useFakeTimers();
      renderSheet();
      const backdrop = document.querySelector("[aria-hidden='true']");
      if (backdrop) fireEvent.click(backdrop);
      vi.advanceTimersByTime(300);
      expect(onClose).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});
