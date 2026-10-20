// Auto-load .env file if available
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // Ignore if .env is missing or already loaded
  }
}

async function run() {
  const { bot } = await import("./bot");
  // Delete any webhook so long polling can receive updates
  await bot.api.deleteWebhook();
  console.log("Starting HerWhispers Telegram bot in polling mode...");
  bot.start();
}

run().catch((error) => {
  console.error("Failed to start bot:", error);
});