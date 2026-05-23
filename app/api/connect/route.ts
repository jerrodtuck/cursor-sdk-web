import { NextResponse } from "next/server";
import { validateApiKey } from "@/lib/agent/validate-api-key";
import {
  API_KEY_COOKIE,
  apiKeyCookieOptions,
  resolveApiKey,
} from "@/lib/agent/api-key-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ConnectRequestBody {
  apiKey?: string;
}

export async function GET(): Promise<Response> {
  const resolved = await resolveApiKey();
  if (!resolved.apiKey) {
    return Response.json({ connected: false, source: null });
  }

  const validation = await validateApiKey(resolved.apiKey);
  if (!validation.ok) {
    return Response.json({
      connected: false,
      source: resolved.source ?? null,
      error: validation.message,
    });
  }

  return Response.json({
    connected: true,
    source: resolved.source ?? null,
  });
}

export async function POST(request: Request): Promise<Response> {
  let body: ConnectRequestBody;
  try {
    body = (await request.json()) as ConnectRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const apiKey = body.apiKey?.trim();
  if (!apiKey) {
    return Response.json({ error: "apiKey is required" }, { status: 400 });
  }

  const validation = await validateApiKey(apiKey);
  if (!validation.ok) {
    return Response.json({ error: validation.message }, { status: 401 });
  }

  const response = NextResponse.json({ connected: true, source: "cookie" });
  response.cookies.set(API_KEY_COOKIE, apiKey, apiKeyCookieOptions());
  return response;
}

export async function DELETE(): Promise<Response> {
  const response = NextResponse.json({ connected: false, source: null });
  response.cookies.set(API_KEY_COOKIE, "", { ...apiKeyCookieOptions(), maxAge: 0 });
  return response;
}
