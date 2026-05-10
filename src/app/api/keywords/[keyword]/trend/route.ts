import { fail, ok } from "@/lib/http";
import { getKeywordTrend } from "@/lib/queries";

interface RouteContext {
  params: Promise<{ keyword: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { keyword } = await context.params;
    const { searchParams } = new URL(request.url);
    return ok(await getKeywordTrend(keyword, searchParams.get("locale")));
  } catch (error) {
    return fail(error);
  }
}
