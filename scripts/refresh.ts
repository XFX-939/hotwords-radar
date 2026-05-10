import { disconnectPrisma } from "../src/lib/db";
import { runHotwordsIngestion } from "../src/lib/ingestion/run";

async function main() {
  const result = await runHotwordsIngestion({ trigger: "manual-script" });
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
