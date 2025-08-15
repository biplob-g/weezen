"use client";

import AiChatBot from "@/components/chatbot";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import React, { useEffect } from "react";
import { onGetAllAccountDomains } from "@/actions/auth";

const ChatBot = () => {
  const searchParams = useSearchParams();
  const { user } = useUser();

  useEffect(() => {
    // Get domain ID from URL parameters first
    const domainId = searchParams.get("domain") || searchParams.get("id");

    console.log("🔍 Chatbot page - Domain ID from URL:", domainId);

    if (domainId) {
      // Use URL parameter if provided
      console.log("📨 Sending postMessage with URL domain ID:", domainId);
      window.postMessage(domainId, "*");
    } else if (user) {
      // Auto-fetch user's first domain if no URL parameter
      console.log("🔍 No URL parameter, fetching user's domains...");
      fetchUserDomain();
    }
  }, [searchParams, user]);

  const fetchUserDomain = async () => {
    try {
      const result = await onGetAllAccountDomains();
      console.log("📊 User's domains result:", result);

      if (result && result.domains && result.domains.length > 0) {
        const firstDomainId = result.domains[0].id;
        console.log("✅ Using first domain ID:", firstDomainId);

        console.log(
          "📨 Sending postMessage with user's domain ID:",
          firstDomainId
        );
        window.postMessage(firstDomainId, "*");
      } else {
        console.log("❌ No domains found for user");
      }
    } catch (error) {
      console.error("💥 Error fetching user domains:", error);
    }
  };

  return <AiChatBot />;
};

export default ChatBot;
