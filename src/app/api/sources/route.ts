import { fail, ok } from "@/lib/http";
import { getSources } from "@/lib/queries";

export async function GET() {
  try {
    return ok(await getSources());
  } catch (error) {
    return fail(error);
  }
}
