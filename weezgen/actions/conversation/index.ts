"use server";

import { client } from "@/lib/prisma";

export const onToggleRealtime = async (id: string, state: boolean) => {
  try {
    const chatRoom = await client.chatRoom.update({
      where: {
        id,
      },
      data: {
        love: state,
      },
      select: {
        id: true,
        love: true,
      },
    });

    if (chatRoom) {
      return {
        status: 200,
        message: chatRoom.love
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
        love: true,
      },
    });
    console.log(mode);
    return mode;
  } catch (error) {
    console.log(error);
  }
};
