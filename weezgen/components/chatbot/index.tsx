import { useChatBot } from "@/hooks/chatbot/useChatBot";
import React from "react";
import BotWindow from "./window";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { BotIcon } from "lucide-react";

const AiChatBot = () => {
  const {
    botOpened,
    onOpenChatBot,
    onstartChatting,
    onChats,
    register,
    onAiTyping,
    messageWindowRef,
    currentBot,
    loading,
    setOnChats,
    onRealTime,
    showUserInfoForm,
    showChatHistory,
    handleUserInfoSubmit,
    handleContinueChat,
    handleStartNewChat,
    isCheckingIP,
    chatHistory,
    currentCustomer,
  } = useChatBot();

  return (
    <div className="h-screen flex flex-col justify-end items-end gap-4">
      {botOpened && (
        <BotWindow
          setChat={setOnChats}
          realtimeMode={onRealTime}
          helpdesk={currentBot?.helpdesk || []}
          domainName={currentBot?.name || ""}
          ref={messageWindowRef}
          help={currentBot?.chatBot?.helpdesk}
          theme={currentBot?.chatBot?.background}
          textColor={currentBot?.chatBot?.textColor}
          chats={onChats}
          register={register}
          onChat={onstartChatting}
          onResponding={onAiTyping}
          showUserInfoForm={showUserInfoForm}
          showChatHistory={showChatHistory}
          onUserInfoSubmit={handleUserInfoSubmit}
          onContinueChat={handleContinueChat}
          onStartNewChat={handleStartNewChat}
          loading={loading}
          isCheckingIP={isCheckingIP}
          chatHistory={chatHistory}
          currentCustomer={currentCustomer}
        />
      )}

      <div
        className={cn(
          "rounded-full relative cursor-pointer shadow-md w-20 h-20 flex items-center justify-center bg-secondary",
          loading ? "invisible" : "visible"
        )}
        onClick={onOpenChatBot}
      >
        {currentBot?.chatBot?.icon ? (
          <Image
            src="https://ucarecdn.com/cc656edf-303d-414f-b0e4-b93ad0bbfd26/WeezIQlogoicon.png"
            alt="bot"
            fill
          />
        ) : (
          <BotIcon />
        )}
      </div>
    </div>
  );
};

export default AiChatBot;
