import { fail, ok } from "@/lib/http";
import { getRelations } from "@/lib/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    return ok(await getRelations(searchParams.get("locale")));
  } catch (error) {
    return fail(error);
  }
}
