import { fail, ok } from "@/lib/http";
import { getKeywordTrend } from "@/lib/queries";

interface RouteContext {
  params: Promise<{ keyword: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { keyword } = await context.params;
    return ok(await getKeywordTrend(keyword));
  } catch (error) {
    return fail(error);
  }
}
