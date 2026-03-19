import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PhoneInput } from "@/components/shared/phone-input";

describe("PhoneInput", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
  };

  function renderInput(overrides = {}) {
    const props = { ...defaultProps, onChange: vi.fn(), ...overrides };
    const result = render(<PhoneInput {...props} />);
    return { ...result, onChange: props.onChange };
  }

  describe("local mode (default)", () => {
    it("renders with +503 prefix", () => {
      renderInput();
      expect(screen.getByText("+503")).toBeInTheDocument();
    });

    it("shows default placeholder", () => {
      renderInput();
      expect(screen.getByPlaceholderText("7890 1234")).toBeInTheDocument();
    });

    it("emits E.164 format on input", () => {
      const { onChange } = renderInput();
      const input = screen.getByPlaceholderText("7890 1234");
      fireEvent.change(input, { target: { value: "78901234" } });
      expect(onChange).toHaveBeenCalledWith("+50378901234");
    });

    it("limits to 8 digits", () => {
      const { onChange } = renderInput();
      const input = screen.getByPlaceholderText("7890 1234");
      fireEvent.change(input, { target: { value: "789012345" } });
      // Should only keep 8 digits
      expect(onChange).toHaveBeenCalledWith("+50378901234");
    });

    it("emits empty string when digits are cleared", () => {
      const { onChange } = renderInput();
      const input = screen.getByPlaceholderText("7890 1234");
      // Type something first, then clear
      fireEvent.change(input, { target: { value: "7890" } });
      onChange.mockClear();
      fireEvent.change(input, { target: { value: "" } });
      expect(onChange).toHaveBeenCalledWith("");
    });

    it("shows 'Not in El Salvador?' link", () => {
      renderInput();
      expect(screen.getByText("Not in El Salvador?")).toBeInTheDocument();
    });

    it("triggers onSubmit on Enter key", () => {
      const onSubmit = vi.fn();
      renderInput({ onSubmit });
      const input = screen.getByPlaceholderText("7890 1234");
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onSubmit).toHaveBeenCalledOnce();
    });
  });

  describe("international mode", () => {
    it("switches to international mode on click", () => {
      renderInput();
      fireEvent.click(screen.getByText("Not in El Salvador?"));
      // +503 prefix should be gone, international placeholder shown
      expect(screen.queryByText("+503")).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText("+1 555 123 4567")).toBeInTheDocument();
    });

    it("shows 'Back to El Salvador' link in international mode", () => {
      renderInput();
      fireEvent.click(screen.getByText("Not in El Salvador?"));
      expect(screen.getByText("Back to El Salvador (+503)")).toBeInTheDocument();
    });

    it("switches back to local mode", () => {
      renderInput();
      fireEvent.click(screen.getByText("Not in El Salvador?"));
      fireEvent.click(screen.getByText("Back to El Salvador (+503)"));
      expect(screen.getByText("+503")).toBeInTheDocument();
    });

    it("emits E.164 format for international numbers", () => {
      const { onChange } = renderInput();
      fireEvent.click(screen.getByText("Not in El Salvador?"));
      const input = screen.getByPlaceholderText("+1 555 123 4567");
      fireEvent.change(input, { target: { value: "+15551234567" } });
      expect(onChange).toHaveBeenCalledWith("+15551234567");
    });

    it("adds + prefix if missing in international mode", () => {
      const { onChange } = renderInput();
      fireEvent.click(screen.getByText("Not in El Salvador?"));
      const input = screen.getByPlaceholderText("+1 555 123 4567");
      fireEvent.change(input, { target: { value: "15551234567" } });
      expect(onChange).toHaveBeenCalledWith("+15551234567");
    });

    it("triggers onSubmit on Enter key in international mode", () => {
      const onSubmit = vi.fn();
      renderInput({ onSubmit });
      fireEvent.click(screen.getByText("Not in El Salvador?"));
      const input = screen.getByPlaceholderText("+1 555 123 4567");
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onSubmit).toHaveBeenCalledOnce();
    });
  });
});
