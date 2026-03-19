import { beforeAll } from "vitest";

/**
 * Global test setup — ensures environment variables are set for all tests.
 */
beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test_key";
  process.env.SUPABASE_SECRET_KEY = "sb_secret_test_key";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3695";
  process.env.WOMPI_SANDBOX = "true";
  process.env.BAKER_EMAILS = "heidi@munchis.sv";
});
