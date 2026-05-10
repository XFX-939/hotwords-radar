import { runHotwordsIngestion } from "./ingestion/run";

interface RefreshOptions {
  trigger: string;
}

export async function runRefreshPipeline(options: RefreshOptions) {
  const result = await runHotwordsIngestion(options);
  return {
    trigger: options.trigger,
    sourceCount: result.sourceCount,
    rawItemCount: result.insertedRawItemCount,
    keywordCount: result.updatedKeywordCount,
    relationCount: 0,
    durationMs: result.durationMs,
    status: result.status
  };
}
