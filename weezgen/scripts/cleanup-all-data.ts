#!/usr/bin/env tsx

import { client } from "../lib/prisma";

async function cleanupAllData() {
  try {
    console.log("🧹 Starting complete data cleanup...");

    // Delete all chat messages first (due to foreign key constraints)
    const deletedMessages = await client.chatMessage.deleteMany({});
    console.log(`🗑️ Deleted ${deletedMessages.count} chat messages`);

    // Delete all chat rooms
    const deletedChatRooms = await client.chatRoom.deleteMany({});
    console.log(`🗑️ Deleted ${deletedChatRooms.count} chat rooms`);

    // Delete all customers (this will also clear IP addresses)
    const deletedCustomers = await client.customer.deleteMany({});
    console.log(`🗑️ Deleted ${deletedCustomers.count} customers`);

    // Delete all customer responses
    const deletedResponses = await client.customerResponses.deleteMany({});
    console.log(`🗑️ Deleted ${deletedResponses.count} customer responses`);

    console.log("✅ Complete data cleanup finished!");
    console.log("📊 Summary:");
    console.log(`  - Chat Messages: ${deletedMessages.count}`);
    console.log(`  - Chat Rooms: ${deletedChatRooms.count}`);
    console.log(`  - Customers: ${deletedCustomers.count}`);
    console.log(`  - Customer Responses: ${deletedResponses.count}`);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    await client.$disconnect();
  }
}

// Run the cleanup
cleanupAllData();
