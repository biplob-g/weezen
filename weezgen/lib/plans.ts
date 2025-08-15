export const getPlanLimits = (plan: string) => {
  const planLimits = {
    STARTER: {
      name: "Starter Plan",
      price: "Free Trial - 14 Days",
      aiCredits: 50,
      emailCredits: 50,
      features: [
        "50 AI chatbot conversations (credit-based)",
        "50 Email Lead campaigns (credit-based)",
        "14-day free trial",
      ],
    },
    GROWTH: {
      name: "Growth Plan",
      price: "$12/month",
      aiCredits: 100,
      emailCredits: 200,
      features: [
        "100 AI chatbot conversations/month (Gemini 2.5 Pro)",
        "Unlimited Gemini 2.5 Flash-Lite after credits",
        "Unlimited human chatbot messages",
        "200 Email Lead campaigns/month",
        "Google Spreadsheet integration",
      ],
    },
    PRO: {
      name: "Pro Plan",
      price: "$39/month",
      aiCredits: 500,
      emailCredits: 1000,
      features: [
        "500 AI chatbot conversations/month (Gemini 2.5 Pro)",
        "Unlimited Gemini 2.5 Flash-Lite after credits",
        "Unlimited human chatbot messages",
        "1000 Email Lead campaigns/month",
        "Google Spreadsheet integration",
      ],
    },
  };

  return planLimits[plan as keyof typeof planLimits] || planLimits.STARTER;
};

export type PlanType = "STARTER" | "GROWTH" | "PRO";

export interface PlanDetails {
  name: string;
  price: string;
  aiCredits: number;
  emailCredits: number;
  features: string[];
}
