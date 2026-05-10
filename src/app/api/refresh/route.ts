import { fail, ok } from "@/lib/http";
import { runHotwordsIngestion } from "@/lib/ingestion/run";

export const runtime = "nodejs";

export async function POST() {
  try {
    if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEV_REFRESH !== "true") {
      return fail(new Error("手动刷新仅在开发模式或显式开启后可用"), 403);
    }

    const result = await runHotwordsIngestion({ trigger: "legacy-refresh-api" });
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
