import React from "react";
import Section from "../SectionLabel";
import { onGetSubscriptionPlan } from "@/actions/settings";
import { Card, CardContent, CardDescription } from "../ui/card";
import { Plus } from "lucide-react";

export const BillingSettings = async () => {
  const plan = await onGetSubscriptionPlan();
  console.log(plan);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
      <div className="lg:col-span-1">
        <Section
          label="Billing Settings"
          message="Add payment information, upgrade and modify your plan"
        />
      </div>
      <div className="lg:col-span-2 flex justify-start lg:justify-center">
        <Card className="border-dashed bg-gray-200 border-gray-400 w-full cursor-pointer h-[270px] flex justify-center items-center">
          <CardContent className="flex gap-2 items-center">
            <div className="rounded-full border-2 p-1">
              <Plus className="text-gray-400" />
            </div>
            <CardDescription className="font-semibold">
              Upgrade Plan
            </CardDescription>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <h3 className="text-xl font-semi:bold mb-2">Current Plan</h3>
        <p className="text-sm font-semibold">{plan?.plan}</p>
        <p className="text-sm font-light">
          {plan?.plan == "PRO"
            ? "Start growing your business today"
            : plan?.plan == "ULTIMATE"
            ? "The ultimate growth plan that sets you up for success"
            : "Perfect if you are just getting started with WeezeIQ"}
        </p>
      </div>
    </div>
  );
};
