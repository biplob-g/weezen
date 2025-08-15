import {
  onAiChatBotAssistant,
  onGetCurrentChatBot,
  onStoreConversations,
} from "@/actions/bot";
import {
  onCreateCustomerWithInfo,
  onFindCustomerByIP,
  onUpdateCustomerIP,
} from "@/actions/conversation";
import { postToParent } from "@/lib/utils";
import {
  ChatBotMessageProps,
  ChatBotMessageSchema,
  UserInfoFormProps,
} from "@/schemas/coversation.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { UploadClient } from "@uploadcare/upload-client";
// import PusherClient from "pusher-js";

const upload = new UploadClient({
  publicKey: process.env.NEXT_PUBLIC_UPLOAD_CARE_PUBLIC_KEY as string,
});

export const useChatBot = () => {
  const { register, handleSubmit, reset } = useForm<ChatBotMessageProps>({
    // @ts-expect-error - Type compatibility issue between Zod and React Hook Form resolver
    resolver: zodResolver(ChatBotMessageSchema),
  });

  const [currentBot, setCurrentBot] = useState<
    | {
        name: string;
        chatBot: {
          id: string;
          icon: string | null;
          welcomeMessage: string | null;
          background: string | null;
          textColor: string | null;
          helpdesk: boolean;
        } | null;
        helpdesk: {
          id: string;
          question: string;
          answered: string;
          domainId: string | null;
        }[];
      }
    | undefined
  >();

  const messageWindowRef = useRef<HTMLDivElement | null>(null);
  const [botOpened, setBotOpened] = useState<boolean>(false);
  const onOpenChatBot = () => setBotOpened((prev) => !prev);
  const [loading, setLoading] = useState<boolean>(false);
  const [onChats, setOnChats] = useState<
    { role: "assistant" | "user"; content: string; link?: string }[]
  >([]);

  // ✅ NEW: Debug onChats changes
  useEffect(() => {
    console.log("🔄 onChats state updated:", onChats);
    console.log("🔄 onChats length:", onChats.length);
    if (onChats.length > 0) {
      onChats.forEach((chat, index) => {
        if (!chat.role) {
          console.error(
            "❌ Chat message without role at index",
            index,
            ":",
            chat
          );
        }
        if (!chat.content) {
          console.error(
            "❌ Chat message without content at index",
            index,
            ":",
            chat
          );
        }
        console.log(`📝 Chat ${index}:`, {
          role: chat.role,
          content: chat.content?.substring(0, 50),
        });
      });
    }
  }, [onChats]);

  // ✅ NEW: Initialize chat state properly
  useEffect(() => {
    console.log("🚀 Initializing chat state");
    setOnChats([]);
  }, []);
  const [onRealTime, setOnRealTime] = useState<
    | {
        chatroom: string;
        mode: boolean;
      }
    | undefined
  >(undefined);
  const [onAiTyping, setOnAiTyping] = useState<boolean>(false);
  const [currentBotId, setCurrentBotId] = useState<string>();

  // ✅ Updated: New states for IP-based customer detection
  const [showUserInfoForm, setShowUserInfoForm] = useState<boolean>(true);
  const [showChatHistory, setShowChatHistory] = useState<boolean>(false);
  const [isCheckingIP, setIsCheckingIP] = useState<boolean>(false);

  const [currentCustomer, setCurrentCustomer] = useState<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    countryCode: string;
    ipAddress?: string;
    createdAt?: Date;
    chatRoom?: Array<{
      id: string;
    }>;
  } | null>(null);

  // ✅ NEW: Chat history state
  const [chatHistory, setChatHistory] = useState<{
    messages: Array<{
      id: string;
      message: string;
      role: "OWNER" | "CUSTOMER";
      createdAt: Date;
    }>;
  } | null>(null);

  const onScrollToBottom = () => {
    messageWindowRef.current?.scroll({
      top: messageWindowRef.current.scrollHeight,
      left: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    onScrollToBottom();
  }, [onChats, messageWindowRef]);

  useEffect(() => {
    postToParent(
      JSON.stringify({
        width: botOpened ? 550 : 80,
        height: botOpened ? 800 : 80,
      })
    );
  }, [botOpened]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const botId = e.data;
      console.log("📥 Received postMessage:", botId, "Type:", typeof botId);

      // Check if it's a valid UUID (domain ID) and not a JSON string
      const isValidDomainId =
        typeof botId === "string" &&
        botId.length === 36 &&
        !botId.startsWith("{");

      if (isValidDomainId) {
        console.log("✅ Processing domain ID:", botId);
        onGetDomainChatBot(botId);
      } else {
        console.log(
          "❌ Skipping message - type:",
          typeof botId,
          "isValidDomainId:",
          isValidDomainId
        );
      }
    };

    window.addEventListener("message", handleMessage);

    // Cleanup function
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const onGetDomainChatBot = async (id: string) => {
    console.log("🔄 Fetching chatbot data for domain ID:", id);
    setCurrentBotId(id);
    setLoading(true);
    setIsCheckingIP(true);

    try {
      // ✅ NEW: Check for existing customer by IP first
      console.log("🔍 Starting IP-based customer detection...");
      const existingCustomer = await onFindCustomerByIP(id);

      if (existingCustomer) {
        console.log("✅ Found existing customer by IP:", existingCustomer.name);

        // Update customer's IP address
        await onUpdateCustomerIP(existingCustomer.id);

        setCurrentCustomer({
          id: existingCustomer.id,
          name: existingCustomer.name || "",
          email: existingCustomer.email || "",
          phone: existingCustomer.phone || undefined,
          countryCode: existingCustomer.countryCode || "+1",
          ipAddress: existingCustomer.ipAddress || undefined,
          createdAt: existingCustomer.createdAt,
          chatRoom: existingCustomer.chatRoom, // ✅ NEW: Include chatRoom data
        });

        // Set chat history
        if (existingCustomer.chatRoom?.[0]?.message) {
          console.log(
            "📝 Setting chat history with",
            existingCustomer.chatRoom[0].message.length,
            "messages"
          );

          // ✅ Better error handling for chat history
          const validMessages = existingCustomer.chatRoom[0].message
            .filter((msg) => {
              if (!msg.role) {
                console.warn(
                  "⚠️ Skipping message with undefined role in history:",
                  msg
                );
                return false;
              }
              return true;
            })
            .map((msg) => ({
              id: msg.id,
              message: msg.message || "",
              role: msg.role as "OWNER" | "CUSTOMER",
              createdAt: msg.createdAt,
            }));

          console.log("✅ Valid messages for chat history:", validMessages);

          setChatHistory({
            messages: validMessages,
          });

          console.log(
            "✅ Chat history set with",
            validMessages.length,
            "valid messages"
          );
        } else {
          console.log("⚠️ No chat messages found for existing customer");
          console.log("existingCustomer.chatRoom:", existingCustomer.chatRoom);
          setChatHistory(null);
        }

        // Show chat history instead of form
        setShowUserInfoForm(false);
        setShowChatHistory(true);
        setIsCheckingIP(false);

        console.log("✅ Returning user detected, showing chat history");
      } else {
        console.log("🆕 New user detected, will show form");
        setShowUserInfoForm(true);
        setShowChatHistory(false);
        setIsCheckingIP(false);
      }

      // Get chatbot data
      const chatbot: Awaited<ReturnType<typeof onGetCurrentChatBot>> =
        await onGetCurrentChatBot(id);

      console.log("📊 Chatbot data received:", chatbot);

      if (chatbot) {
        setCurrentBot({
          ...chatbot,
          chatBot: chatbot.chatBot
            ? {
                ...chatbot.chatBot,
                helpdesk: chatbot.chatBot.helpdesk ?? false,
              }
            : null,
        });

        console.log("✅ Chatbot data loaded successfully");
      } else {
        console.log("❌ No chatbot data received");
      }
    } catch (error) {
      console.error("💥 Error fetching chatbot data:", error);
      setShowUserInfoForm(true);
      setShowChatHistory(false);
    } finally {
      setLoading(false);
      setIsCheckingIP(false);
    }
  };

  // ✅ NEW: Handle continue chat from history
  const handleContinueChat = () => {
    console.log("🔄 handleContinueChat called");
    console.log("📋 chatHistory:", chatHistory);
    console.log("👤 currentCustomer:", currentCustomer);

    if (chatHistory && currentCustomer) {
      console.log("✅ Both chatHistory and currentCustomer exist");
      console.log(
        "📝 Number of messages in history:",
        chatHistory.messages.length
      );
      console.log("🏠 Chat room ID:", currentCustomer.chatRoom?.[0]?.id);

      if (chatHistory.messages.length > 0) {
        // Convert chat history to current chat format with better error handling
        const historyChats = chatHistory.messages
          .filter((msg) => {
            // ✅ Filter out messages with invalid roles
            if (!msg.role) {
              console.warn("⚠️ Skipping message with undefined role:", msg);
              return false;
            }
            return true;
          })
          .map((msg) => {
            // ✅ Ensure role is properly mapped
            const role = msg.role === "OWNER" ? "assistant" : "user";
            console.log("🔄 Mapping message role:", msg.role, "->", role);

            return {
              role: role as "assistant" | "user",
              content: msg.message || "",
            };
          });

        console.log(
          "✅ Continuing chat from history with",
          historyChats.length,
          "messages"
        );
        console.log("📋 History chats:", historyChats);

        // ✅ Update chat state directly
        setOnChats(historyChats);
        console.log("✅ Chat state update triggered");
      } else {
        // No messages in history, start fresh
        console.log("⚠️ No messages in history, starting fresh");
        setOnChats([]);
        console.log("✅ Starting fresh chat (no history messages)");
      }

      setShowChatHistory(false);
    } else {
      console.error("❌ Missing chatHistory or currentCustomer");
      console.log("chatHistory exists:", !!chatHistory);
      console.log("currentCustomer exists:", !!currentCustomer);
    }
  };

  // ✅ NEW: Handle start new chat for returning users
  const handleStartNewChat = () => {
    console.log("🔄 handleStartNewChat called");
    console.log("👤 currentCustomer:", currentCustomer);

    if (currentCustomer) {
      // ✅ For returning users, we need to create a NEW chat room
      console.log("✅ Creating new chat room for returning user");

      // Clear current chat state and chat room reference
      setOnChats([]);
      setShowChatHistory(false);

      // ✅ Clear the current customer's chat room reference so a new one will be created
      setCurrentCustomer((prev) =>
        prev
          ? {
              ...prev,
              chatRoom: [], // Clear the existing chat room reference
            }
          : null
      );

      console.log(
        "✅ Ready for new chat - new chat room will be created on first message"
      );
    } else {
      console.error("❌ No current customer found for new chat");
    }
  };

  const handleUserInfoSubmit = async (userInfo: UserInfoFormProps) => {
    try {
      if (!currentBotId) return;

      const result = await onCreateCustomerWithInfo(currentBotId, userInfo);

      if (result?.success && result.customer) {
        setCurrentCustomer({
          id: result.customer.id,
          name: result.customer.name || "",
          email: result.customer.email || "",
          phone: result.customer.phone || undefined,
          countryCode: result.customer.countryCode || "+1",
          chatRoom: result.customer.chatRoom, // ✅ NEW: Include chatRoom data
        });
        setShowUserInfoForm(false);

        // Add welcome message with user's name
        const welcomeMessage = `Hello ${userInfo.name}! 👋 Welcome to our chat. How can I help you today?`;

        setOnChats((prev) => [
          ...prev,
          {
            role: "assistant",
            content: welcomeMessage,
          },
        ]);

        // Store the conversation in the database
        if (result.customer.chatRoom?.[0]?.id) {
          await onStoreConversations(
            result.customer.chatRoom[0].id,
            welcomeMessage,
            "assistant"
          );
        }
      }
    } catch (error) {
      console.error("Error creating customer:", error);
    }
  };

  const onstartChatting = handleSubmit(async (values) => {
    try {
      reset();
      if (values.image?.length) {
        const uploaded = await upload.uploadFile(values.image[0]);
        setOnChats((prev) => [
          ...prev,
          {
            role: "user",
            content: uploaded.uuid,
          },
        ]);

        setOnAiTyping(true);
        const response = await onAiChatBotAssistant(
          currentBotId!,
          onChats,
          "user",
          uploaded.uuid,
          currentCustomer?.email
        );
        if (response) {
          setOnAiTyping(false);

          // ✅ Check if response has an error (for backward compatibility)
          if ("error" in response && response.error) {
            console.error("❌ AI Response error:", response.error);

            // ✅ Customer-friendly error message (no technical details)
            const aiMessage = {
              role: "assistant" as const,
              content:
                "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
            };

            setOnChats((prev) => [...prev, aiMessage]);
            setOnAiTyping(false);
            return;
          }

          if (response.live) {
            setOnRealTime((prev) => ({
              ...prev,
              chatroom: response.chatRoom,
              mode: response.live,
            }));
          } else {
            // ✅ Enhanced debugging for AI response (image)
            console.log("🤖 AI Response received (image):", response);
            console.log("🤖 Response type (image):", typeof response);
            console.log("🤖 Response.response (image):", response.response);

            // ✅ Handle different response structures
            let aiMessage: { role: "assistant"; content: string } | undefined;

            if (response.response && typeof response.response === "object") {
              // Structure: { response: { role: "assistant", content: "..." } }
              aiMessage = {
                role: "assistant" as const,
                content:
                  response.response.content ||
                  "I'm sorry, I couldn't process that.",
              };
            } else if ("role" in response && "content" in response) {
              // Structure: { role: "assistant", content: "..." }
              const responseWithContent = response as {
                role: string;
                content: string;
              };
              aiMessage = {
                role: "assistant" as const,
                content: responseWithContent.content,
              };
            } else {
              console.error(
                "❌ Invalid AI response structure (image):",
                response
              );

              // ✅ Customer-friendly error message
              aiMessage = {
                role: "assistant" as const,
                content:
                  "I'm sorry, I couldn't process that. Please try again.",
              };
            }

            if (aiMessage) {
              setOnChats((prev) => [...prev, aiMessage]);
            }

            console.log("🤖 Adding AI response (image):", aiMessage);
            setOnChats((prev) => {
              console.log("🔄 Previous chats (image):", prev);
              const newChats = [...prev, aiMessage];
              console.log("🔄 New chats (image):", newChats);
              return newChats;
            });
          }
        } else {
          console.error("❌ No response received from AI (image)");
          setOnAiTyping(false);

          // ✅ Customer-friendly error message
          const aiMessage = {
            role: "assistant" as const,
            content:
              "I'm sorry, I didn't receive a response. Please try again.",
          };

          setOnChats((prev) => [...prev, aiMessage]);
        }
      }

      if (values.content) {
        // ✅ OPTIMIZED: Update UI immediately for better responsiveness
        const userMessage = {
          role: "user" as const,
          content: values.content || "",
        };

        setOnChats((prev) => [...prev, userMessage]);
        setOnAiTyping(true);

        // ✅ Store user message in database in background
        let chatRoomId = currentCustomer?.chatRoom?.[0]?.id;

        if (chatRoomId) {
          console.log(
            "💾 Storing user message for returning customer in existing chat room:",
            chatRoomId
          );
          // ✅ Store in background without blocking UI
          onStoreConversations(chatRoomId, values.content, "user")
            .then(() => {
              console.log(
                "✅ User message stored successfully in existing chat room"
              );
            })
            .catch((error) => {
              console.error("❌ Failed to store user message:", error);
            });
        } else {
          // ✅ Create new chat room for returning user starting fresh OR new chat
          console.log("🏗️ Creating new chat room for returning user");
          onCreateCustomerWithInfo(
            currentBotId || "", // domainId
            {
              name: currentCustomer?.name || "Returning User",
              email: currentCustomer?.email || "",
              phone: currentCustomer?.phone || undefined,
              countryCode: currentCustomer?.countryCode || "+1",
            }
          )
            .then((newChatRoom) => {
              if (newChatRoom?.customer?.chatRoom?.[0]?.id) {
                chatRoomId = newChatRoom.customer.chatRoom[0].id;
                console.log("✅ New chat room created:", chatRoomId);

                // Update current customer with new chat room
                setCurrentCustomer({
                  id: newChatRoom.customer.id,
                  name: newChatRoom.customer.name || "Returning User",
                  email: newChatRoom.customer.email || "",
                  phone: newChatRoom.customer.phone || undefined,
                  countryCode: newChatRoom.customer.countryCode || "+1",
                  ipAddress: newChatRoom.customer.ipAddress || undefined,
                  createdAt: newChatRoom.customer.createdAt,
                  chatRoom: newChatRoom.customer.chatRoom,
                });

                // Store the message in the new chat room
                if (chatRoomId) {
                  const roomId = chatRoomId;
                  return onStoreConversations(roomId, values.content, "user");
                }
              } else {
                console.error(
                  "❌ Failed to create new chat room for returning user"
                );
              }
            })
            .then(() => {
              console.log("✅ User message stored in new chat room");
            })
            .catch((error) => {
              console.error("❌ Failed to store user message:", error);
            });
        }

        const response = await onAiChatBotAssistant(
          currentBotId!,
          onChats,
          "user",
          values.content,
          currentCustomer?.email
        );

        if (response) {
          setOnAiTyping(false);

          // ✅ Check if response has an error (for backward compatibility)
          if ("error" in response && response.error) {
            console.error("❌ AI Response error:", response.error);

            // ✅ Customer-friendly error message (no technical details)
            const aiMessage = {
              role: "assistant" as const,
              content:
                "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
            };

            setOnChats((prev) => [...prev, aiMessage]);
            setOnAiTyping(false);
            return;
          }

          if (response.live) {
            setOnRealTime((prev) => ({
              ...prev,
              chatroom: response.chatRoom,
              mode: response.live,
            }));
          } else {
            // ✅ Enhanced debugging for AI response
            console.log("🤖 AI Response received:", response);
            console.log("🤖 Response type:", typeof response);
            console.log("🤖 Response.response:", response.response);

            // ✅ Handle different response structures
            let aiMessage: { role: "assistant"; content: string } | undefined;

            if (response.response && typeof response.response === "object") {
              // Structure: { response: { role: "assistant", content: "..." } }
              aiMessage = {
                role: "assistant" as const,
                content:
                  response.response.content ||
                  "I'm sorry, I couldn't process that.",
              };
            } else if ("role" in response && "content" in response) {
              // Structure: { role: "assistant", content: "..." }
              const responseWithContent = response as {
                role: string;
                content: string;
              };
              aiMessage = {
                role: "assistant" as const,
                content: responseWithContent.content,
              };
            } else {
              console.error("❌ Invalid AI response structure:", response);

              // ✅ Customer-friendly error message
              aiMessage = {
                role: "assistant" as const,
                content:
                  "I'm sorry, I couldn't process that. Please try again.",
              };
            }

            if (aiMessage) {
              console.log("🤖 Adding AI response (text):", aiMessage);
              setOnChats((prev) => [...prev, aiMessage]);
            }

            // ✅ Store AI response in database for returning users
            if (chatRoomId && aiMessage) {
              console.log(
                "💾 Storing AI response for returning customer in chat room:",
                chatRoomId
              );
              await onStoreConversations(
                chatRoomId,
                aiMessage.content,
                "assistant"
              );
              console.log("✅ AI response stored successfully");
            } else {
              console.error(
                "❌ No chat room ID or AI message available for storing"
              );
            }
          }
        } else {
          console.error("❌ No response received from AI");
          setOnAiTyping(false);

          // ✅ Customer-friendly error message
          const aiMessage = {
            role: "assistant" as const,
            content:
              "I'm sorry, I didn't receive a response. Please try again.",
          };

          setOnChats((prev) => [...prev, aiMessage]);
        }
      }
    } catch (error) {
      console.error("Error in chat function:", error);
      setOnAiTyping(false);
    }
  });

  return {
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
    currentCustomer,
    handleUserInfoSubmit,
    handleContinueChat,
    handleStartNewChat,
    showChatHistory,
    isCheckingIP,
    chatHistory,
  };
};

// export const useRealtime = (
//   chatRoom: string,
//   setChats: React.Dispatch<
//     React.SetStateAction<
//       {
//         role: "user" | "assistant";
//         content: string;
//         link?: string | undefined;
//       }[]
//     >
//   >
// ) => {
//   useEffect(() => {
//     PusherClient.subscribe(chatRoom);
//     PusherClient.bind("realtime-mode", (data: any) => {
//       setChats((prev: any) => [
//         ...prev,
//         {
//           role: data.chat.role,
//           content: data.chat.message,
//         },
//       ]);
//     });

//     return () => PusherClient.unsubscribe("realtime-mode");
//   }, []);
// };
