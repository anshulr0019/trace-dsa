import { createClient } from "@supabase/supabase-js";
const config = import.meta.env as Record<string, string | undefined>;
export const cloud =
  config.VITE_SUPABASE_URL && config.VITE_SUPABASE_PUBLISHABLE_KEY
    ? createClient(
        config.VITE_SUPABASE_URL,
        config.VITE_SUPABASE_PUBLISHABLE_KEY,
      )
    : null;
export async function result<T>(
  request: PromiseLike<{ data: T; error: { message: string } | null }>,
): Promise<T> {
  const response = await request;
  if (response.error) throw Error(response.error.message);
  return response.data;
}
