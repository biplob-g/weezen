#!/usr/bin/env tsx

/**
 * Script to update existing customers with IP addresses for testing
 * This will help test the chat history feature
 */

import { client } from "../lib/prisma";

async function updateExistingCustomers() {
  try {
    console.log("🔄 Updating existing customers with IP addresses...");

    // Get all customers without IP addresses
    const customersWithoutIP = await client.customer.findMany({
      where: {
        OR: [{ ipAddress: null }, { ipAddress: "" }],
      },
      select: {
        id: true,
        name: true,
        email: true,
        domainId: true,
      },
    });

    console.log(
      `📊 Found ${customersWithoutIP.length} customers without IP addresses`
    );

    if (customersWithoutIP.length === 0) {
      console.log("✅ All customers already have IP addresses");
      return;
    }

    // Update each customer with a test IP address
    for (let i = 0; i < customersWithoutIP.length; i++) {
      const customer = customersWithoutIP[i];

      // Use different IP addresses for testing
      const testIP = i === 0 ? "127.0.0.1" : `192.168.1.${i + 1}`;

      await client.customer.update({
        where: { id: customer.id },
        data: { ipAddress: testIP },
      });

      console.log(
        `✅ Updated ${customer.name || customer.email} with IP: ${testIP}`
      );
    }

    console.log("🎉 Successfully updated all customers with IP addresses");
  } catch (error) {
    console.error("❌ Error updating customers:", error);
  } finally {
    await client.$disconnect();
  }
}

// Run update if this script is executed directly
if (require.main === module) {
  updateExistingCustomers()
    .then(() => {
      console.log("🎉 Update completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Update failed:", error);
      process.exit(1);
    });
}

export { updateExistingCustomers };
