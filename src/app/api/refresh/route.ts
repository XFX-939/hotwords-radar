import { fail, ok } from "@/lib/http";
import { runRefreshPipeline } from "@/lib/refresh";

export async function POST() {
  try {
    if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEV_REFRESH !== "true") {
      return fail(new Error("手动刷新仅在开发模式或显式开启后可用"), 403);
    }

    const result = await runRefreshPipeline({ trigger: "manual-api" });
    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
