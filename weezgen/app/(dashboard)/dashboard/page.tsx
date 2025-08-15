"use client";

import React, { useState, useEffect } from "react";
import { onGetSubscriptionPlan } from "@/actions/settings";
import { getPlanLimits } from "@/lib/plans";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { onCreateSubscription } from "@/actions/payment";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  CreditCard,
  Mail,
  MessageSquare,
  Zap,
  Loader2,
} from "lucide-react";

interface RazorpayResponse {
  razorpay_subscription_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

const PricingTiersPage = () => {
  const [subscription, setSubscription] = useState<any>(null); // TODO: Define proper subscription type
  const [loading, setLoading] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const sub = await onGetSubscriptionPlan();
        setSubscription(sub);
      } catch (error) {
        console.error("Error fetching subscription:", error);
        toast.error("Failed to load subscription information");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const handleUpgrade = async (planId: string) => {
    console.log("Upgrade plan selected:", planId);
    console.log("User:", user);

    if (!user) {
      toast.error("Please sign in to upgrade your plan");
      return;
    }

    setLoading(planId);

    try {
      console.log("Creating subscription for plan:", planId);
      const result = await onCreateSubscription(planId as "GROWTH" | "PRO");
      console.log("Subscription result:", result);

      if (!result.success || !result.subscription) {
        toast.error("Failed to create subscription");
        return;
      }

      // Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        console.log("Razorpay script loaded successfully");
        console.log(
          "Environment variable check:",
          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
        );

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          subscription_id: result.subscription.id,
          name: "WeezGen",
          description: `${planId} Plan Subscription`,
          handler: async (response: RazorpayResponse) => {
            try {
              const verifyResult = await fetch("/api/payment/verify", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ...response,
                  planType: planId,
                }),
              });

              const verifyData = await verifyResult.json();
              console.log("Payment verification response:", verifyData);

              if (verifyData.success) {
                toast.success(
                  "Payment successful! Your plan has been upgraded!"
                );
                // Refresh the page to show updated subscription
                window.location.reload();
              } else {
                console.error("Payment verification failed:", verifyData.error);
                toast.error(`Payment verification failed: ${verifyData.error}`);
              }
            } catch (error) {
              console.error("Payment verification error:", error);
              toast.error("Payment verification failed");
            }
          },
          prefill: {
            name: user.fullName || "",
            email: user.emailAddresses[0]?.emailAddress || "",
          },
          theme: {
            color: "#2563eb",
          },
          modal: {
            ondismiss: () => {
              setLoading(null);
            },
          },
        };

        console.log("Razorpay options:", options);
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };

      script.onerror = () => {
        toast.error("Failed to load payment gateway");
        setLoading(null);
      };

      document.body.appendChild(script);
    } catch (error) {
      console.error("Payment initiation error:", error);
      toast.error("Failed to initiate payment");
    } finally {
      setLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p>Unable to load subscription information.</p>
      </div>
    );
  }

  const currentPlan = subscription.plan || "STARTER";
  const planDetails = getPlanLimits(currentPlan);

  // Calculate progress percentages
  const aiCreditProgress =
    subscription.aiCreditsLimit && subscription.aiCreditsLimit > 0
      ? ((subscription.aiCreditsUsed || 0) / subscription.aiCreditsLimit) * 100
      : 0;

  const emailCreditProgress =
    subscription.emailCreditsLimit && subscription.emailCreditsLimit > 0
      ? ((subscription.emailCreditsUsed || 0) /
          subscription.emailCreditsLimit) *
        100
      : 0;

  const allPlans = [
    {
      plan: "STARTER",
      ...getPlanLimits("STARTER"),
      current: currentPlan === "STARTER",
    },
    {
      plan: "GROWTH",
      ...getPlanLimits("GROWTH"),
      current: currentPlan === "GROWTH",
    },
    {
      plan: "PRO",
      ...getPlanLimits("PRO"),
      current: currentPlan === "PRO",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard - Pricing & Usage</h1>
        <Badge
          variant={currentPlan === "STARTER" ? "secondary" : "default"}
          className="text-sm"
        >
          {planDetails.name}
        </Badge>
      </div>

      {/* Current Plan Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Usage - {planDetails.name}
          </CardTitle>
          <CardDescription>
            Track your current plan usage and remaining credits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* AI Credits Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">AI Chatbot Conversations</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {subscription.aiCreditsUsed || 0} /{" "}
                {subscription.aiCreditsLimit || 0} credits used
              </span>
            </div>
            <Progress value={aiCreditProgress} className="h-2" />
            {currentPlan !== "STARTER" && (
              <p className="text-xs text-muted-foreground">
                After {subscription.aiCreditsLimit} credits, unlimited Gemini
                2.5 Flash-Lite model
              </p>
            )}
          </div>

          {/* Email Credits Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="font-medium">Email Lead Campaigns</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {subscription.emailCreditsUsed || 0} /{" "}
                {subscription.emailCreditsLimit || 0} emails sent
              </span>
            </div>
            <Progress value={emailCreditProgress} className="h-2" />
          </div>

          {/* Domains Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="font-medium">Active Domains</span>
            </div>
            <span className="text-sm font-semibold">
              {subscription.domains}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* All Pricing Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-4">All Pricing Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {allPlans.map((plan) => (
            <Card
              key={plan.plan}
              className={`relative ${
                plan.current ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {plan.current && (
                <Badge className="absolute -top-2 left-4 bg-blue-500">
                  Current Plan
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  <span className="text-lg font-bold text-green-600">
                    {plan.price}
                  </span>
                </CardTitle>
                <CardDescription>
                  {plan.plan === "STARTER" && "Perfect for getting started"}
                  {plan.plan === "GROWTH" && "Ideal for growing businesses"}
                  {plan.plan === "PRO" && "For established businesses"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI Credits (Pro Model)</span>
                    <span className="font-semibold">{plan.aiCredits}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Campaigns</span>
                    <span className="font-semibold">{plan.emailCredits}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Features:</h4>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-xs"
                      >
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.plan !== "STARTER" && !plan.current && (
                  <Button
                    className="w-full mt-4"
                    onClick={() => handleUpgrade(plan.plan)}
                    disabled={loading === plan.plan}
                  >
                    {loading === plan.plan ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Credit Calculation Info */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Calculation</CardTitle>
          <CardDescription>
            How AI credits are calculated and consumed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">
                  Pro Model Credits (Gemini 2.5 Pro)
                </p>
                <p className="text-muted-foreground">
                  1 credit = 1000 API tokens. Used for high-quality AI
                  responses.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">
                  Flash Model (Gemini 2.5 Flash-Lite)
                </p>
                <p className="text-muted-foreground">
                  Unlimited usage after Pro credits are exhausted. No credits
                  consumed.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium">Human Messages</p>
                <p className="text-muted-foreground">
                  Unlimited human chatbot messages on Growth and Pro plans.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PricingTiersPage;
