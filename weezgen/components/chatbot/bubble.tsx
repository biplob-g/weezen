import { cn, extractUUIDFromString, getMonthName } from "@/lib/utils";
import React from "react";
import { Avatar, AvatarImage } from "../ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  message: {
    role: "assistant" | "user";
    content: string;
    link?: string;
    createdAt?: Date;
  };
};

const Bubble = ({ message }: Props) => {
  const d = new Date();

  // ✅ Enhanced error handling and debugging
  if (!message) {
    console.error("❌ Bubble component received undefined message");
    return null;
  }

  const messageContent = message?.content || "";
  const messageRole = message?.role || "user"; // ✅ Default to "user" if role is undefined

  // ✅ Debug logging
  if (!message.role) {
    console.warn("⚠️ Message without role:", message);
  }

  const image = messageContent ? extractUUIDFromString(messageContent) : null;

  return (
    <div
      className={cn(
        "flex gap-2 items-end",
        messageRole === "assistant" ? "self-start" : "self-end flex-row-reverse"
      )}
    >
      {messageRole === "assistant" ? (
        <Avatar className="w-5 h-5">
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      ) : (
        <Avatar className="w-5 h-5">
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "flex flex-col gap-3 min-w-[20px] max-w-[300px] p-4 rounded-t-md",
          messageRole === "assistant"
            ? "bg-primary rounded-r-md"
            : "bg-primary rounded-t-md"
        )}
      >
        {message.createdAt ? (
          <div className="flex gap-2 text-xs text-gray-600">
            <p>
              {message.createdAt.getDate()}{" "}
              {getMonthName(message.createdAt.getMonth())}
            </p>
            <p>
              {message.createdAt.getHours()}:{message.createdAt.getMinutes()}
              {message.createdAt.getHours() > 12 ? "PM" : "AM"}
            </p>
          </div>
        ) : (
          <p className="text-xs">
            {`${d.getHours()}:${d.getMinutes()} ${
              d.getHours() > 12 ? "PM" : "AM"
            }`}
          </p>
        )}

        {image ? (
          <div className="relative aspect-square">
            <Image src={`https://ucarecdn.com/${image[0]}/`} fill alt="image" />
          </div>
        ) : (
          <p className="text-sm">
            {messageContent.replace("(complete)", " ")}
            {message.link && (
              <Link
                className="underline font-bold pl-2"
                href={message.link}
                target="_blank"
              >
                Your Link
              </Link>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export default Bubble;
