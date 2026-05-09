import { fail, ok } from "@/lib/http";
import { getKeywordDetail } from "@/lib/queries";

interface RouteContext {
  params: Promise<{ keyword: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { keyword } = await context.params;
    const data = await getKeywordDetail(keyword);
    if (!data) return fail(new Error("热词不存在"), 404);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
