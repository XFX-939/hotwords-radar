import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/http";
import { getKeywordList } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const data = await getKeywordList({
      range: searchParams.get("range") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      source: searchParams.get("source") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      locale: searchParams.get("locale") ?? undefined,
      limit: Number(searchParams.get("limit") ?? 100)
    });
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
