"use server";

import { client } from "@/lib/prisma";
import { UserInfoFormProps } from "@/schemas/coversation.schema";
import { getClientIP } from "@/lib/ipUtils";
import { headers } from "next/headers";
// import PusherServer from "pusher";

export const onToggleRealtime = async (id: string, state: boolean) => {
  try {
    const chatRoom = await client.chatRoom.update({
      where: {
        id,
      },
      data: {
        live: state,
      },
      select: {
        id: true,
        live: true,
      },
    });

    if (chatRoom) {
      return {
        status: 200,
        message: chatRoom.live
          ? "Realtime mode enabled"
          : "realtime mode disabled",
        chatRoom,
      };
    }
  } catch (error) {
    console.log(error);
  }
};

export const onGetConversationMode = async (id: string) => {
  try {
    const mode = await client.chatRoom.findUnique({
      where: {
        id,
      },
      select: {
        live: true,
      },
    });
    console.log(mode);
    return mode;
  } catch (error) {
    console.log(error);
  }
};

export const onGetDomainChatRooms = async (id: string) => {
  try {
    const domains = await client.domain.findUnique({
      where: {
        id,
      },
      select: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            countryCode: true,
            chatRoom: {
              select: {
                createdAt: true,
                id: true,
                message: {
                  select: {
                    message: true,
                    createdAt: true,
                    seen: true,
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                  take: 5, // ✅ Get more messages for better filtering
                },
              },
            },
          },
        },
      },
    });
    if (domains) {
      return domains;
    }
  } catch (error) {
    console.log(error);
  }
};

export const onGetChatMessages = async (id: string) => {
  try {
    const messages = await client.chatRoom.findMany({
      where: {
        id,
      },
      select: {
        id: true,
        live: true,
        message: {
          select: {
            id: true,
            role: true,
            message: true,
            createdAt: true,
            seen: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (messages) {
      return messages;
    }
  } catch (error) {
    console.log(error);
  }
};

export const onViewUnReadMessages = async (id: string) => {
  try {
    await client.chatMessage.updateMany({
      where: {
        chatRoomId: id,
      },
      data: {
        seen: true,
      },
    });
  } catch (error) {
    console.log(error);
  }
};

export const onOwnerSendMessage = async (
  chatRoom: string,
  message: string,
  role: "assistant" | "user"
) => {
  try {
    const chat = await client.chatRoom.update({
      where: {
        id: chatRoom,
      },
      data: {
        message: {
          create: {
            message,
            role: role === "assistant" ? "OWNER" : "CUSTOMER",
          },
        },
      },
      select: {
        message: {
          select: {
            id: true,
            role: true,
            message: true,
            createdAt: true,
            seen: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (chat) {
      return chat;
    }
  } catch (error) {
    console.log(error);
  }
};

export const onCreateCustomerWithInfo = async (
  domainId: string,
  userInfo: UserInfoFormProps
) => {
  try {
    // Get client IP address
    const headersList = await headers();
    const clientIP = getClientIP(headersList);

    const customer = await client.customer.create({
      data: {
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        countryCode: userInfo.countryCode,
        ipAddress: clientIP, // ✅ Store IP address
        domainId: domainId,
        chatRoom: {
          create: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        countryCode: true,
        ipAddress: true,
        domainId: true,
        createdAt: true,
        chatRoom: {
          select: {
            id: true,
          },
        },
      },
    });

    if (customer) {
      return { success: true, customer };
    }
  } catch (error) {
    console.error("Error creating customer:", error);
    throw new Error("Failed to create customer");
  }
};

// ✅ NEW: Find existing customer by IP address
export const onFindCustomerByIP = async (domainId: string) => {
  try {
    const headersList = await headers();
    const clientIP = getClientIP(headersList);

    console.log("🔍 IP Detection Debug:");
    console.log("  - Domain ID:", domainId);
    console.log("  - Client IP:", clientIP);
    console.log("  - Headers available:", Array.from(headersList.keys()));

    if (!clientIP) {
      console.log("❌ No client IP detected");
      return null;
    }

    // For development/testing, let's also check if there are any customers with this IP
    const allCustomersWithIP = await client.customer.findMany({
      where: {
        ipAddress: clientIP,
      },
      select: {
        id: true,
        name: true,
        domainId: true,
        createdAt: true,
      },
    });

    console.log("🔍 All customers with this IP:", allCustomersWithIP);

    const customer = await client.customer.findFirst({
      where: {
        ipAddress: clientIP,
        domainId: domainId,
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Within 14 days
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        countryCode: true,
        ipAddress: true,
        createdAt: true,
        chatRoom: {
          select: {
            id: true,
            message: {
              select: {
                id: true,
                message: true,
                role: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    });

    console.log("✅ Customer found by IP:", customer ? "YES" : "NO");
    if (customer) {
      console.log("  - Customer name:", customer.name);
      console.log(
        "  - Chat messages:",
        customer.chatRoom?.[0]?.message?.length || 0
      );
    }

    return customer;
  } catch (error) {
    console.error("❌ Error finding customer by IP:", error);
    return null;
  }
};

// ✅ NEW: Get chat history for a customer
export const onGetCustomerChatHistory = async (customerId: string) => {
  try {
    const chatHistory = await client.customer.findUnique({
      where: {
        id: customerId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        countryCode: true,
        createdAt: true,
        chatRoom: {
          select: {
            id: true,
            createdAt: true,
            message: {
              select: {
                id: true,
                message: true,
                role: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    });

    return chatHistory;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return null;
  }
};

// ✅ NEW: Update customer IP address (for returning users)
export const onUpdateCustomerIP = async (customerId: string) => {
  try {
    const headersList = await headers();
    const clientIP = getClientIP(headersList);

    const customer = await client.customer.update({
      where: {
        id: customerId,
      },
      data: {
        ipAddress: clientIP,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        countryCode: true,
        ipAddress: true,
      },
    });

    return customer;
  } catch (error) {
    console.error("Error updating customer IP:", error);
    return null;
  }
};

// ✅ NEW: Clean up old customer records (older than 14 days)
export const onCleanupOldCustomers = async () => {
  try {
    const cutoffDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const deletedCount = await client.customer.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Cleaned up ${deletedCount.count} old customer records`);
    return deletedCount.count;
  } catch (error) {
    console.error("Error cleaning up old customers:", error);
    return 0;
  }
};

export const onGetCustomerInfo = async (customerId: string) => {
  try {
    const customer = await client.customer.findUnique({
      where: {
        id: customerId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        countryCode: true,
        domainId: true,
      },
    });

    if (customer) {
      return customer;
    }
  } catch (error) {
    console.error("Error fetching customer info:", error);
    throw new Error("Failed to fetch customer information");
  }
};

// ✅ NEW: Delete conversation/chat room
export const onDeleteConversation = async (chatRoomId: string) => {
  try {
    console.log("🗑️ Deleting conversation:", chatRoomId);

    // First, check if the chat room exists
    const existingChatRoom = await client.chatRoom.findUnique({
      where: { id: chatRoomId },
      select: { id: true, customerId: true },
    });

    if (!existingChatRoom) {
      throw new Error("Chat room not found");
    }

    // Delete the chat room (this will cascade delete messages due to foreign key constraints)
    const deletedChatRoom = await client.chatRoom.delete({
      where: {
        id: chatRoomId,
      },
      select: {
        id: true,
        customerId: true,
      },
    });

    console.log("✅ Conversation deleted successfully:", deletedChatRoom.id);
    return { success: true, deletedChatRoom };
  } catch (error) {
    console.error("❌ Error deleting conversation:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        throw new Error("Conversation not found");
      } else if (error.message.includes("foreign key")) {
        throw new Error(
          "Cannot delete conversation due to existing references"
        );
      } else {
        throw new Error(`Failed to delete conversation: ${error.message}`);
      }
    }

    throw new Error("Failed to delete conversation");
  }
};

// export const onRealTimeChat = async (
//   chatroomId: string,
//   message: string,
//   id: string,
//   role: "assistant" | "owner"
// ) => {
//   PusherServer.trigger(chatroomId, "realtime-mode", {
//     chat: {
//       message,
//       id,
//       role,
//     },
//   });
// };
