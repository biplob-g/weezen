"use client";
import { useChatTime } from "@/hooks/conversation/useConversation";
import React, { useState } from "react";
import { Card, CardContent, CardDescription } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Radio, User, Clock, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

type Props = {
  title: string;
  description: string;
  createdAt: Date;
  id: string;
  onChat(): void;
  onDelete?: (id: string) => void; // ✅ NEW: Add delete handler
  showDelete?: boolean; // ✅ NEW: Control delete button visibility
  seen?: boolean;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerCountryCode?: string | null;
  isExpired?: boolean; // ✅ NEW: Add expired prop
};

const ChatCard = ({
  title,
  description,
  createdAt,
  id,
  onChat,
  onDelete,
  showDelete = false, // ✅ NEW: Default to false
  seen,
  customerName,
  customerEmail,
  customerPhone,
  customerCountryCode,
  isExpired = false, // ✅ NEW: Default to false
}: Props) => {
  const { messageSentAt, urgent } = useChatTime(createdAt, id);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(id);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card
      onClick={onChat}
      className={`rounded-none border-r-0 hover:bg-muted cursor-pointer transition duration-150 ease-in-out ${
        isExpired ? "border-l-4 border-l-orange-500" : ""
      }`}
    >
      <CardContent className="bg-muted">
        <div>
          <Avatar>
            <AvatarFallback className="bg-muted">
              <User />
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex justify-between w-full">
          <div>
            <div className="flex gap-5 items-center">
              <CardDescription className="font-bold leading-none text-gray-600">
                {customerName || title}
              </CardDescription>
              {urgent && !seen && <Radio />}
              {isExpired && <Clock className="w-4 h-4 text-orange-500" />}{" "}
              {/* ✅ NEW: Expired indicator */}
            </div>
            <div className="space-y-1">
              <CardDescription>
                {description
                  ? description.substring(0, 20) + "..."
                  : "This chatroom is empty"}
              </CardDescription>
              {customerEmail && (
                <CardDescription className="text-xs text-gray-500">
                  📧 {customerEmail}
                </CardDescription>
              )}
              {customerPhone && (
                <CardDescription className="text-xs text-gray-500">
                  📞 {customerCountryCode} {customerPhone}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="w-[100px] flex justify-end items-center gap-2">
            {showDelete && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                    title="Delete conversation"
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this conversation? This
                      action cannot be undone and will permanently remove all
                      messages and customer data associated with this chat.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-500 hover:bg-red-600 text-white"
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <CardDescription className="text-sm">
              {createdAt ? messageSentAt : ""}
            </CardDescription>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatCard;
