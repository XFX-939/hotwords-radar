import { fail, ok } from "@/lib/http";
import { getDailyReport } from "@/lib/queries";

export async function GET() {
  try {
    return ok(await getDailyReport());
  } catch (error) {
    return fail(error);
  }
}
