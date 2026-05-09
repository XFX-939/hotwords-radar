import { fail, ok } from "@/lib/http";
import { getRelations } from "@/lib/queries";

export async function GET() {
  try {
    return ok(await getRelations());
  } catch (error) {
    return fail(error);
  }
}
