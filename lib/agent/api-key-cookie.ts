import { cookies } from "next/headers";

export const API_KEY_COOKIE = "cursor_demo_api_key";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

export function apiKeyCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  };
}

function devEnvApiKey(): string | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  return process.env.CURSOR_API_KEY?.trim() || undefined;
}

export type ApiKeySource = "cookie" | "env";

export async function resolveApiKey(): Promise<{
  apiKey?: string;
  source?: ApiKeySource;
}> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(API_KEY_COOKIE)?.value?.trim();
  if (fromCookie) {
    return { apiKey: fromCookie, source: "cookie" };
  }

  const fromEnv = devEnvApiKey();
  if (fromEnv) {
    return { apiKey: fromEnv, source: "env" };
  }

  return {};
}

export async function getApiKeyFromCookies(): Promise<string | undefined> {
  const { apiKey } = await resolveApiKey();
  return apiKey;
}
