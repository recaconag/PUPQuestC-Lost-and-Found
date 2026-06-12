import cron from "node-cron";
import prisma from "../config/prisma";
import { systemSettingsService } from "../modules/systemSettings/systemSettings.service";

export const runExpiryCleanup = async (): Promise<boolean> => {
  try {
    const settings = await systemSettingsService.getSettings();

    if (settings.itemExpiryDays <= 0) {
      console.log("[Scheduler] Item expiry disabled (itemExpiryDays = 0). Skipping.");
      return true;
    }

    const cutoff = new Date(Date.now() - settings.itemExpiryDays * 86400000);

    // ── Mark expired (not yet expired) ──────────────────────────────
    const [expiredFound, expiredLost] = await Promise.all([
      prisma.foundItem.updateMany({
        where: {
          isDeleted: false,
          isExpired: false,
          isClaimed: false,
          createdAt: { lt: cutoff },
        },
        data: { isExpired: true, expiredAt: new Date() },
      }),
      prisma.lostItem.updateMany({
        where: {
          isDeleted: false,
          isExpired: false,
          isFound: false,
          createdAt: { lt: cutoff },
        },
        data: { isExpired: true, expiredAt: new Date() },
      }),
    ]);

    console.log(
      `[Scheduler] Marked expired — Found: ${expiredFound.count}, Lost: ${expiredLost.count}`
    );

    // ── Auto-delete if enabled ────────────────────────────────────────
    if (settings.autoDeleteExpiredItems) {
      const [deletedFound, deletedLost] = await Promise.all([
        prisma.foundItem.updateMany({
          where: { isExpired: true, isDeleted: false },
          data: { isDeleted: true, deletedAt: new Date() },
        }),
        prisma.lostItem.updateMany({
          where: { isExpired: true, isDeleted: false },
          data: { isDeleted: true, deletedAt: new Date() },
        }),
      ]);

      console.log(
        `[Scheduler] Auto-deleted — Found: ${deletedFound.count}, Lost: ${deletedLost.count}`
      );
    }
    return true;
  } catch (err) {
    console.error("[Scheduler] Item expiry/cleanup job failed:", err);
    return false;
  }
};

export const startScheduler = () => {
  // Run startup execution trigger to clean up any missed expired items
  console.log("[Scheduler] Running startup item expiry + cleanup scan...");
  
  const runWithRetry = async (retries = 3, delayMs = 5000) => {
    const success = await runExpiryCleanup();
    if (!success && retries > 0) {
      console.log(`[Scheduler] Startup cleanup failed. Retrying in ${delayMs / 1000}s... (${retries} retries left)`);
      setTimeout(() => runWithRetry(retries - 1, delayMs), delayMs);
    }
  };

  runWithRetry();

  // Runs every day at midnight (00:00)
  cron.schedule("0 0 * * *", async () => {
    console.log("[Cron] Running nightly item expiry + cleanup job...");
    await runExpiryCleanup();
  });

  console.log("[Cron] Nightly scheduler registered (00:00 daily).");
};
