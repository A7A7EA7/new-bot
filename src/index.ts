import { startBot } from "./bot";
import { logger } from "./logger";

startBot().catch((err) => {
  logger.error({ err }, "Failed to start bot");
  process.exit(1);
});
