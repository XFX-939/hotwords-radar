import { runRefreshPipeline } from "../src/lib/refresh";
import { disconnectPrisma } from "../src/lib/db";

async function main() {
  const result = await runRefreshPipeline({ trigger: "manual-script" });
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
