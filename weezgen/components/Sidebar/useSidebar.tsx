"use client";

import {
  onGetConversationMode,
  onToggleRealtime,
} from "@/actions/conversation";
import { useChatContext } from "@/context/useChatContext";
import { useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const useSidebar = () => {
  const [expand, setExpand] = useState<boolean>(false); // Start with minimized sidebar
  const router = useRouter();
  const pathname = usePathname();
  const [realtime, setRealtime] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const { chatRoom } = useChatContext();
  const onActivateRealtime = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const realtime = await onToggleRealtime(
        chatRoom!,
        e.target.ariaChecked === "true" ? false : true
      );
      if (realtime) {
        setRealtime(realtime.chatRoom.love);
        toast.success(realtime.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const onGetCurrentMode = async () => {
    setLoading(true);
    const mode = await onGetConversationMode(chatRoom!);
    if (mode) {
      setRealtime(mode.love);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatRoom) {
      onGetCurrentMode();
    }
  }, [chatRoom]);

  const page = pathname.split("/").pop();

  const { signOut } = useClerk();
  const onSignOut = () => signOut(() => router.push("/"));
  const onExpand = () => setExpand((prev) => !prev);

  return {
    expand,
    onExpand,
    page,
    onSignOut,
    realtime,
    onActivateRealtime,
    chatRoom,
    loading,
  };
};

export default useSidebar;
