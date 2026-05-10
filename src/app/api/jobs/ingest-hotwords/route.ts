import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/http";
import { runHotwordsIngestion } from "@/lib/ingestion/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handleIngestionRequest(request);
}

// Vercel Cron invokes API paths with GET and an Authorization header.
export async function GET(request: NextRequest) {
  return handleIngestionRequest(request);
}

async function handleIngestionRequest(request: NextRequest) {
  try {
    const authError = authorize(request);
    if (authError) return authError;

    const body = await readJsonBody(request);
    const sourceKey = body?.sourceKey || request.nextUrl.searchParams.get("sourceKey") || undefined;
    const result = await runHotwordsIngestion({
      trigger: request.method === "GET" ? "vercel-cron" : "manual-api",
      sourceKey
    });
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}

function authorize(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const tokenHeader = request.headers.get("x-cron-secret");
  const tokenQuery = request.nextUrl.searchParams.get("secret");

  if (secret && (authHeader === `Bearer ${secret}` || tokenHeader === secret || tokenQuery === secret)) {
    return null;
  }

  if (process.env.NODE_ENV !== "production" || process.env.ENABLE_DEV_REFRESH === "true") {
    return null;
  }

  return fail(new Error("Unauthorized: CRON_SECRET 校验失败"), 401);
}

async function readJsonBody(request: NextRequest) {
  if (request.method !== "POST") return null;
  try {
    return (await request.json()) as { sourceKey?: string } | null;
  } catch {
    return null;
  }
}

