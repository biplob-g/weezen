import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";
import { Header } from "@/components/header";
import AuthHeader from "@/components/auth-header";

type Props = {
  children: React.ReactNode;
};

const Layout = async ({ children }: Props) => {
  const user = await currentUser();

  if (user) redirect("/");
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Header />

      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen pt-20 pb-12 px-4">
        <div className="w-full max-w-md">
          <AuthHeader />
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
