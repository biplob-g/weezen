import InfoBars from "@/components/infoBar";
import { BillingSettings } from "@/components/settings/BillingSettings";
import ChangePassword from "@/components/settings/ChangePassword";
import DarkModeToggle from "@/components/settings/DarkModeToggle";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

const Dashboard = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/auth/sign-in");
  }
  return (
    <>
      <InfoBars />
      <div className=" w-full chat-window flex-1 h-8 flex flex-col gap-10">
        <BillingSettings />
        <DarkModeToggle />
        <ChangePassword/>
      </div>
    </>
  );
};

export default Dashboard;
