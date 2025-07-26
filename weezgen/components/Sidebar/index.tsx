"use client";

import React from "react";
import useSidebar from "./useSidebar";
import { cn } from "@/lib/utils";
import MaxMenu from "./maximizedMenu";
import MinMenu from "./minimizedmenu";

type Props = {
  domains:
    | {
        id: string;
        name: string;
        icon: string | null;
      }[]
    | null
    | undefined;
};

function SideBar({ domains }: Props) {
  const { expand, onExpand, page, onSignOut } = useSidebar();

  return (
    <div
      className={cn(
        "bg-gray-200 h-full transition-all duration-300 ease-in-out",
        expand ? "w-[250px]" : "w-[60px]"
      )}
    >
      {expand ? (
        <MaxMenu
          domains={domains}
          current={page}
          onExpand={onExpand}
          onSignOut={onSignOut}
        />
      ) : (
        <MinMenu
          domains={domains}
          onExpand={onExpand}
          current={page}
          onSignOut={onSignOut}
        />
      )}
    </div>
  );
}

export default SideBar;
