import React from "react";

type Props = {
  chatRoomId: string;
  setChats: React.Dispatch<
    React.SetStateAction<
      {
        role: "user" | "assistant";
        content: string;
        link?: string | undefined;
      }[]
    >
  >;
};

const RealTimeMode = ({ chatRoomId, setChats }: Props) => {
  //  useRealTime(chatRoomId, setChats)
  return (
    <div className="px-3 rounded-full py-1 bg-primary font-bold text-white text-sm">
      Real TIme
    </div>
  );
};

export default RealTimeMode;
