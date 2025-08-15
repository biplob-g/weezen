import { getAllDomainsForStaticGeneration } from "../actions/settings";

async function testStaticGeneration() {
  console.log("🧪 Testing static generation for domain settings...");

  try {
    // Test the function that generates static params
    const allDomains = await getAllDomainsForStaticGeneration();

    console.log(`📊 Found ${allDomains.length} domains in database`);

    if (allDomains.length > 0) {
      console.log("✅ Sample domains found:");
      allDomains.slice(0, 3).forEach((domain, index) => {
        console.log(`  ${index + 1}. ${domain.name} (ID: ${domain.id})`);
      });

      // Simulate generateStaticParams
      const staticParams = allDomains.map((domain) => ({
        domain: domain.name,
      }));

      console.log(`🔧 Would generate ${staticParams.length} static paths:`);
      staticParams.slice(0, 5).forEach((param, index) => {
        console.log(`  ${index + 1}. /settings/${param.domain}`);
      });

      if (staticParams.length > 5) {
        console.log(`  ... and ${staticParams.length - 5} more`);
      }
    } else {
      console.log("⚠️  No domains found in database");
    }

    console.log("✅ Static generation test completed successfully!");
  } catch (error) {
    console.error("❌ Error testing static generation:", error);
  }
}

// Run the test
testStaticGeneration();
