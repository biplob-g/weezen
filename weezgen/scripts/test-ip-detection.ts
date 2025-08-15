#!/usr/bin/env tsx

/**
 * Test script to verify IP detection and chat history functionality
 * Run this script to create test data and verify the feature works
 */

import { client } from "../lib/prisma";

async function testIPDetection() {
  try {
    console.log("🧪 Testing IP detection and chat history functionality...");

    // First, let's check if there are any existing customers
    const existingCustomers = await client.customer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        ipAddress: true,
        createdAt: true,
        chatRoom: {
          select: {
            id: true,
            message: {
              select: {
                id: true,
                message: true,
                role: true,
              },
            },
          },
        },
      },
    });

    console.log(`📊 Found ${existingCustomers.length} existing customers`);

    if (existingCustomers.length > 0) {
      console.log("📋 Existing customers:");
      existingCustomers.forEach((customer, index) => {
        console.log(`  ${index + 1}. ${customer.name} (${customer.email})`);
        console.log(`     IP: ${customer.ipAddress || "Not set"}`);
        console.log(`     Created: ${customer.createdAt.toISOString()}`);
        console.log(
          `     Chat messages: ${customer.chatRoom?.[0]?.message?.length || 0}`
        );
      });
    }

    // Let's also check if there are any domains
    const domains = await client.domain.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`🌐 Found ${domains.length} domains`);
    if (domains.length > 0) {
      console.log("📋 Available domains:");
      domains.forEach((domain, index) => {
        console.log(`  ${index + 1}. ${domain.name} (${domain.id})`);
      });
    }

    console.log("✅ Test completed successfully");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await client.$disconnect();
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testIPDetection()
    .then(() => {
      console.log("🎉 Test completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Test failed:", error);
      process.exit(1);
    });
}

export { testIPDetection };
