import {
  ChatBotMessageProps,
  UserInfoFormProps,
} from "@/schemas/coversation.schema";
import React, { forwardRef, useEffect } from "react";
import { UseFormRegister } from "react-hook-form";
import { Avatar, AvatarImage } from "../ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";
import RealTimeMode from "./realtime";
import Image from "next/image";
import TabsMenu from "../tabs";
import { BOT_TABS_MENU } from "@/constants/menu";
import { Paperclip, Send } from "lucide-react";
import Bubble from "./bubble";
import { Responding } from "./responding";
import { Separator } from "../ui/separator";
import { TabsContent } from "../ui/tabs";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { CardDescription, CardTitle } from "../ui/card";
import Accordion from "../accordion";
import Link from "next/link";
import UserInfoForm from "./UserInfoForm";
import ChatHistory from "./ChatHistory";

type BotWindowProps = {
  register: UseFormRegister<ChatBotMessageProps>;
  chats: {
    role: "assistant" | "user";
    content: string;
    link?: string;
  }[];
  onChat(): void;
  onResponding: boolean;
  domainName: string;
  theme?: string | null;
  textColor?: string | null;
  help?: boolean;
  realtimeMode:
    | {
        chatroom: string;
        mode: boolean;
      }
    | undefined;
  helpdesk: {
    id: string;
    question: string;
    answered: string;
    domainId: string | null;
  }[];
  setChat: React.Dispatch<
    React.SetStateAction<
      {
        role: "user" | "assistant";
        content: string;
        link?: string | undefined;
      }[]
    >
  >;
  showUserInfoForm?: boolean;
  showChatHistory?: boolean;
  onUserInfoSubmit?: (data: UserInfoFormProps) => void;
  onContinueChat?: () => void;
  onStartNewChat?: () => void;
  loading?: boolean;
  isCheckingIP?: boolean;
  chatHistory?: {
    messages: Array<{
      id: string;
      message: string;
      role: "OWNER" | "CUSTOMER";
      createdAt: Date;
    }>;
  } | null;
  currentCustomer?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    countryCode: string;
  } | null;
};

const BotWindow = forwardRef<HTMLDivElement, BotWindowProps>(
  (
    {
      register,
      chats,
      onChat,
      onResponding,
      domainName,
      theme,
      textColor,
      help,
      realtimeMode,
      helpdesk,
      setChat,
      showUserInfoForm = false,
      showChatHistory = false,
      onUserInfoSubmit,
      onContinueChat,
      onStartNewChat,
      loading = false,
      isCheckingIP = false,
      chatHistory,
      currentCustomer,
    },
    ref
  ) => {
    // ✅ Debug: Monitor chat state changes
    useEffect(() => {
      console.log("🔄 BotWindow: chats state changed:", chats);
      console.log("🔄 BotWindow: chats length:", chats.length);
      console.log("🔄 BotWindow: showChatHistory:", showChatHistory);
      console.log("🔄 BotWindow: showUserInfoForm:", showUserInfoForm);
      console.log("🔄 BotWindow: chatHistory:", chatHistory);
      console.log("🔄 BotWindow: currentCustomer:", currentCustomer);
      console.log("🔄 BotWindow: isCheckingIP:", isCheckingIP);
    }, [
      chats,
      showChatHistory,
      showUserInfoForm,
      chatHistory,
      currentCustomer,
      isCheckingIP,
    ]);

    return (
      <div className="h-[800px] w-[400px] flex flex-col bg-white rounded-xl mr-[80px] border-[1px] overflow-hidden">
        <div className="flex justify-between px-4 pt-4">
          <div className="flex gap-2">
            <Avatar className="w-10 h-10">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>

            <div className="flex items-start flex-col">
              <h3 className="text-lg font-bold leading-none mt-3">
                Sales Rep - WeezIQ
              </h3>
              <p className="text-sm">{domainName.split(".com")[0]}</p>
              {realtimeMode?.mode && (
                <RealTimeMode
                  setChats={setChat}
                  chatRoomId={realtimeMode.chatroom}
                />
              )}
            </div>
          </div>
          <div className="relative w-16 h-16 mt-[-10px]">
            <Image
              src="https://ucarecdn.com/0dda3228-ad1e-42e9-aef2-8f69696458ed/users.jpg"
              fill
              alt="users"
              objectFit="contain"
            />
          </div>
        </div>

        {/* ✅ NEW: Show loading state while checking IP */}
        {isCheckingIP ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">
                Checking for previous conversations...
              </p>
            </div>
          </div>
        ) : showUserInfoForm ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <UserInfoForm onSubmit={onUserInfoSubmit!} loading={loading} />
          </div>
        ) : showChatHistory && chatHistory && currentCustomer ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <ChatHistory
              messages={chatHistory.messages}
              customerName={currentCustomer.name}
              onContinueChat={onContinueChat!}
              onStartNewChat={onStartNewChat!}
            />
          </div>
        ) : (
          <TabsMenu triggers={BOT_TABS_MENU} classname=" bg-transparent m-2">
            <TabsContent value="chat">
              <Separator orientation="horizontal" />
              <div className="flex flex-col h-full">
                <div
                  style={{
                    background: theme || "",
                    color: textColor || "",
                  }}
                  className="px-3 flex h-[400px] flex-col py-5 gap-3 chat-window overflow-y-auto"
                  ref={ref}
                >
                  {/* ✅ Debug: Show chat count */}
                  {chats.length > 0 && (
                    <div className="text-xs text-gray-500 mb-2">
                      Debug: {chats.length} messages loaded
                    </div>
                  )}

                  {chats
                    .filter((chat) => chat && chat.role && chat.content) // ✅ Filter out invalid messages
                    .map((chat, key) => (
                      <Bubble
                        key={`${chat.role}-${key}-${chat.content?.substring(
                          0,
                          10
                        )}`}
                        message={chat}
                      />
                    ))}
                  {onResponding && <Responding />}
                </div>
                <form
                  onSubmit={onChat}
                  className="flex px-3 py-1 flex-col flex-1 bg-porcelain"
                >
                  <div className="flex justify-between">
                    <Input
                      {...register("content")}
                      placeholder="Type your message..."
                      className="focus-visible:ring-0 flex-1 p-2 focus-visible:ring-offset-0 bg-gray-100 rounded-none outline-none border-none"
                    />
                    <Button type="submit" className="cursor-pointer ml-2">
                      <Send />
                    </Button>
                  </div>
                  <Label htmlFor="upload" className="flex flex-row">
                    <Paperclip />
                    <Input
                      type="file"
                      id="upload"
                      {...register("image")}
                      className="hidden"
                    />
                  </Label>
                </form>
              </div>
            </TabsContent>
            {help && (
              <TabsContent value="helpdesk" className="cursor-pointer">
                <div className="cursor-pointer h-[485px] overflow-y-auto overflow-x-hidden p-4 flex flex-col gap-4">
                  <div>
                    <CardTitle className="cursor-pointer">Help Desk</CardTitle>
                    <CardDescription>
                      Browse from a list of questions people usually ask.
                    </CardDescription>
                  </div>
                  <Separator orientation="horizontal" />
                  {helpdesk.map((desk) => (
                    <Accordion
                      key={desk.id}
                      id={desk.id}
                      trigger={desk.question}
                      content={desk.answered}
                    />
                  ))}
                </div>
              </TabsContent>
            )}
          </TabsMenu>
        )}

        <div className="flex justify-center">
          <p className="text-xs text-gray-500">
            Powered by
            <Link
              target="_blank"
              className="ml-1 text-primary"
              href="https://weeziq.com"
            >
              WeezIQ.com
            </Link>
          </p>
        </div>
      </div>
    );
  }
);

export default BotWindow;
BotWindow.displayName = "BotWindow";
