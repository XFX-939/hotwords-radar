import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const command = process.argv[2] ?? "dev";
const args = process.argv.slice(3);
const nextCli = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));

const child = spawn(process.execPath, [nextCli, command, ...args], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_TEST_WASM: "1",
    NEXT_TEST_WASM_DIR: "node_modules/@next/swc-wasm-nodejs",
    NEXT_TELEMETRY_DISABLED: "1"
  }
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
