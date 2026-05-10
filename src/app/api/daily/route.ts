import { fail, ok } from "@/lib/http";
import { getDailyReport } from "@/lib/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    return ok(await getDailyReport(searchParams.get("locale")));
  } catch (error) {
    return fail(error);
  }
}
