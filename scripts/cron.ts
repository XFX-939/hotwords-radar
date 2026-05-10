import cron from "node-cron";
import { runHotwordsIngestion } from "../src/lib/ingestion/run";

const schedule = "0 9,15,20 * * *";
const lunchSchedule = "30 11 * * *";

console.log("Felix's HotWords Radar cron worker started.");
console.log("Schedules: 09:00, 11:30, 15:00, 20:00 Asia/Shanghai");

for (const expression of [schedule, lunchSchedule]) {
  cron.schedule(
    expression,
    async () => {
      try {
        const result = await runHotwordsIngestion({ trigger: "node-cron" });
        console.log(`[cron] refresh ok`, result);
      } catch (error) {
        console.error("[cron] refresh failed", error);
      }
    },
    { timezone: "Asia/Shanghai" }
  );
}
