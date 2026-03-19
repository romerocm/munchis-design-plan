/**
 * Test data constants for E2E tests.
 * These values should match what's in the Supabase dev/sandbox database.
 */
export const TEST_CUSTOMER = {
  name: "Test Customer",
  whatsapp: "70001234",
  email: "test@example.com",
} as const;

export const TEST_BAKER = {
  email: process.env.BAKER_EMAIL || "heidi@munchis.sv",
  password: process.env.BAKER_PASSWORD || "test-password",
} as const;

/**
 * Wait helpers for common UI patterns.
 */
export const TIMEOUTS = {
  /** Time for API response + re-render */
  API_RESPONSE: 5_000,
  /** Time for page navigation */
  NAVIGATION: 10_000,
  /** Time for animation to complete */
  ANIMATION: 1_000,
} as const;
