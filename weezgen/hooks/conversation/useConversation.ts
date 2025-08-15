import {
  onGetChatMessages,
  onGetDomainChatRooms,
  onOwnerSendMessage,
  onViewUnReadMessages,
} from "@/actions/conversation";
import { useChatContext } from "@/context/useChatContext";
import { getMonthName } from "@/lib/utils";
import {
  ChatBotMessageSchema,
  ConversationSearchScehma,
} from "@/schemas/coversation.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

export const useConversation = () => {
  const { register, watch, setValue } = useForm({
    resolver: zodResolver(ConversationSearchScehma as any),
    mode: "onChange",
  });
  const {
    setLoading: loadMessages,
    setChats,
    setChatRoom,
    chatRoom,
  } = useChatContext();

  const [chatRooms, setChatRooms] = useState<
    {
      chatRoom: {
        id: string;
        createdAt: Date;
        message: {
          message: string;
          createdAt: Date;
          seen: boolean;
        }[];
      }[];
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      countryCode: string | null;
    }[]
  >([]);

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const search = watch((value) => {
      if (value.domain) {
        // ✅ NEW: Only fetch if domain is selected
        setLoading(true);
        try {
          onGetDomainChatRooms(value.domain).then((rooms) => {
            if (rooms) {
              setLoading(false);
              setChatRooms(rooms.customer);
            }
          });
        } catch (error) {
          console.log(error);
          setLoading(false);
        }
      }
    });
    return () => search.unsubscribe();
  }, [watch]);

  const onGetActiveChatMessages = async (id: string) => {
    try {
      loadMessages(true);
      // ✅ Clear previous chats when selecting a new conversation
      setChats([]);

      const messages = await onGetChatMessages(id);
      if (messages) {
        setChatRoom(id);
        loadMessages(false);
        setChats(
          messages[0].message.map((msg) => ({
            ...msg,
            role: msg.role === "OWNER" ? "assistant" : "user",
          }))
        );
      }
    } catch (error) {
      console.log(error);
      loadMessages(false);
    }
  };

  // ✅ NEW: Function to refresh chat messages (for tab switching)
  const refreshChatMessages = async () => {
    if (chatRoom) {
      await onGetActiveChatMessages(chatRoom);
    }
  };

  return {
    register,
    setValue, // ✅ NEW: Return setValue
    chatRooms,
    loading,
    onGetActiveChatMessages,
    refreshChatMessages, // ✅ NEW: Export refresh function
  };
};

export const useChatTime = (createdAt: Date, roomId: string) => {
  const { chatRoom } = useChatContext();
  const [messageSentAt, setMessageSentAt] = useState<string>();
  const [urgent, setUrgent] = useState<boolean>(false);
  const onSetMessageReceivedDate = () => {
    const dt = new Date(createdAt);
    const current = new Date();
    const currentDate = current.getDate();
    const hr = dt.getHours();
    const min = dt.getMinutes();
    const date = dt.getDate();
    const month = dt.getMonth();
    const difference = currentDate - date;

    if (difference <= 0) {
      setMessageSentAt(`${hr}:${min}${hr > 12 ? "PM" : "AM"}`);
      if (current.getHours() - dt.getHours() < 2) {
        setUrgent(true);
      }
    } else {
      setMessageSentAt(`${date} ${getMonthName(month)}`);
    }
  };

  const onSeenChat = async () => {
    if (chatRoom == roomId && urgent) {
      await onViewUnReadMessages(roomId);
      setUrgent(false);
    }
  };

  useEffect(() => {
    onSeenChat();
  }, [chatRoom]);

  useEffect(() => {
    onSetMessageReceivedDate();
  }, []);

  return { messageSentAt, urgent, onSeenChat };
};

export const useChatWindow = () => {
  const { chats, loading, setChats, chatRoom } = useChatContext();
  const messageWindowRef = useRef<HTMLDivElement | null>(null);
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(ChatBotMessageSchema as any),
    mode: "onChange",
  });
  const onScrollToBottom = () => {
    messageWindowRef.current?.scroll({
      top: messageWindowRef.current.scrollHeight,
      left: 0,
      behavior: "smooth",
    });
  };
  useEffect(() => {
    onScrollToBottom();
  }, [chats, messageWindowRef]);

  // WIP : Setup pusher

  // useEffect(() =>{
  //   if(chatRoom) {
  //     pusherClient.subscribe(chatRoom)
  //     pusherClient.bind('realtime-mode', (data: any) =>{
  //       setChats((prev) => [...prev, data.chat])
  //     })

  //     return() => pusherClient.unsubscribe('realtime-mode')
  //   }
  // }, [chatRoom])

  const onHandleSentMessage = handleSubmit(async (values) => {
    try {
      if (!chatRoom) {
        console.error("❌ No chat room selected");
        return;
      }

      const message = await onOwnerSendMessage(
        chatRoom,
        values.content,
        "assistant"
      );

      if (message) {
        // ✅ FIXED: Don't manually add to chats array - let the database fetch handle it
        // This prevents duplicate messages
        console.log(
          "✅ Message sent successfully, will be fetched from database"
        );

        // ✅ Clear the input field
        reset();

        // ✅ WIP : uncomment this when pusher is set
        // await onRealTimeChat(
        //   chatRoom!,
        //   message.message[0].message,
        //   message.message[0].id,
        //   'assistant'
        // )
      }
    } catch (error) {
      console.log(error);
    }
  });

  // ✅ NEW: Function to clear chats when switching tabs
  const clearChats = useCallback(() => {
    setChats([]);
  }, [setChats]);

  return {
    messageWindowRef,
    register,
    onHandleSentMessage,
    chats,
    loading,
    chatRoom,
    reset,
    clearChats, // ✅ NEW: Export clearChats function
  };
};
