#!/usr/bin/env tsx

/**
 * Cleanup script to remove customer records older than 14 days
 * Run this script periodically (e.g., daily) to maintain database performance
 */

import { client } from "../lib/prisma";

async function cleanupOldCustomers() {
  try {
    console.log("🧹 Starting cleanup of old customer records...");

    const cutoffDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    console.log(`📅 Removing records older than: ${cutoffDate.toISOString()}`);

    // Count records that will be deleted
    const countToDelete = await client.customer.count({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`📊 Found ${countToDelete} records to delete`);

    if (countToDelete === 0) {
      console.log("✅ No old records to clean up");
      return;
    }

    // Delete old records
    const result = await client.customer.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`✅ Successfully deleted ${result.count} old customer records`);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  } finally {
    await client.$disconnect();
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupOldCustomers()
    .then(() => {
      console.log("🎉 Cleanup completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Cleanup failed:", error);
      process.exit(1);
    });
}

export { cleanupOldCustomers };
