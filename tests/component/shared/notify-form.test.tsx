import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { NotifyForm } from "@/components/shared/notify-form";

describe("NotifyForm", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  it("renders phone input and notify button", () => {
    render(<NotifyForm />);
    expect(screen.getByText("Notify me")).toBeInTheDocument();
    expect(screen.getByText("+503")).toBeInTheDocument();
  });

  it("renders custom subtitle", () => {
    render(<NotifyForm subtitle="Get notified for next week" />);
    expect(screen.getByText("Get notified for next week")).toBeInTheDocument();
  });

  it("submits to /api/notify on button click", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    render(<NotifyForm />);

    // Type a phone number
    const input = screen.getByPlaceholderText("7890 1234");
    fireEvent.change(input, { target: { value: "78901234" } });

    // Click notify
    fireEvent.click(screen.getByText("Notify me"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp: "+50378901234", drop_id: undefined }),
      });
    });
  });

  it("passes dropId in the request body", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    render(<NotifyForm dropId="drop-123" />);

    const input = screen.getByPlaceholderText("7890 1234");
    fireEvent.change(input, { target: { value: "78901234" } });
    fireEvent.click(screen.getByText("Notify me"));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/notify", expect.objectContaining({
        body: JSON.stringify({ whatsapp: "+50378901234", drop_id: "drop-123" }),
      }));
    });
  });

  it("shows success message on 200 response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    render(<NotifyForm />);

    const input = screen.getByPlaceholderText("7890 1234");
    fireEvent.change(input, { target: { value: "78901234" } });
    fireEvent.click(screen.getByText("Notify me"));

    await waitFor(() => {
      expect(screen.getByText("You're on the list!")).toBeInTheDocument();
    });
  });

  it("shows error state on failed response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400 });
    render(<NotifyForm />);

    const input = screen.getByPlaceholderText("7890 1234");
    fireEvent.change(input, { target: { value: "78901234" } });
    fireEvent.click(screen.getByText("Notify me"));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Try again.")).toBeInTheDocument();
    });
  });

  it("shows error on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    render(<NotifyForm />);

    const input = screen.getByPlaceholderText("7890 1234");
    fireEvent.change(input, { target: { value: "78901234" } });
    fireEvent.click(screen.getByText("Notify me"));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Try again.")).toBeInTheDocument();
    });
  });

  it("shows loading state while submitting", async () => {
    let resolvePromise: (value: unknown) => void;
    mockFetch.mockReturnValueOnce(new Promise((r) => { resolvePromise = r; }));
    render(<NotifyForm />);

    const input = screen.getByPlaceholderText("7890 1234");
    fireEvent.change(input, { target: { value: "78901234" } });
    fireEvent.click(screen.getByText("Notify me"));

    // Should show loading
    expect(screen.getByText("...")).toBeInTheDocument();

    // Resolve
    resolvePromise!({ ok: true });
    await waitFor(() => {
      expect(screen.getByText("You're on the list!")).toBeInTheDocument();
    });
  });

  it("does not submit with empty input", () => {
    render(<NotifyForm />);
    fireEvent.click(screen.getByText("Notify me"));
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
