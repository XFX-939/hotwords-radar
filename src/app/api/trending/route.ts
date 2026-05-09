import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/http";
import { getKeywordList } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const data = await getKeywordList({
      range: searchParams.get("range") ?? "7d",
      category: searchParams.get("category") ?? undefined,
      source: searchParams.get("source") ?? undefined,
      sort: searchParams.get("sort") ?? "heat",
      search: searchParams.get("search") ?? undefined,
      limit: 200
    });
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
