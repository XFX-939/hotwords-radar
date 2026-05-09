import { NextResponse } from "next/server";

export function ok<T>(data: T) {
  return NextResponse.json({ data });
}

export function fail(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message }, { status });
}
