import { fail, ok } from "@/lib/http";
import { getKeywordDetail } from "@/lib/queries";

interface RouteContext {
  params: Promise<{ keyword: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { keyword } = await context.params;
    const { searchParams } = new URL(request.url);
    const data = await getKeywordDetail(keyword, searchParams.get("locale"));
    if (!data) return fail(new Error("热词不存在"), 404);
    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
