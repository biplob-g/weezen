import { onLoginUser } from "@/actions/auth";
import SideBar from "@/components/Sidebar";
import { ChatProvider } from "@/context/useChatContext";
import React from "react";

type Props = {
  children: React.ReactNode;
};

const OwnerLayout = async ({ children }: Props) => {
  const authenticated = await onLoginUser();

  return (
    <ChatProvider>
      <div className="flex h-screen w-full bg-gray-100">
        <SideBar domains={authenticated?.domain} />
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {children}
        </div>
      </div>
    </ChatProvider>
  );
};

export default OwnerLayout;
