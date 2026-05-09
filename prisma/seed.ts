import { runRefreshPipeline } from "../src/lib/refresh";
import { disconnectPrisma } from "../src/lib/db";

async function main() {
  const result = await runRefreshPipeline({ trigger: "seed" });
  console.log(
    `Seeded Felix's HotWords Radar: ${result.keywordCount} keywords, ${result.rawItemCount} raw items, ${result.sourceCount} sources.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
