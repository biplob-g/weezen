import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

type Props = {
  size: "max" | "min";
  label: string;
  icon: React.ReactNode;
  path?: string;
  current?: string;
  onSignOut?(): void;
};

const MenuItem = ({ size, label, icon, path, current, onSignOut }: Props) => {
  switch (size) {
    case "max":
      return (
        <Link
          href={path ? `/${path}` : "#"}
          onClick={onSignOut}
          className={cn(
            "flex flex-center gap-2 px-1 py-2 rounded-lg my-1",
            !current
              ? "text-gray-500"
              : current === path
              ? "bg-white font-bold text-black"
              : "text-gray-500"
          )}
        >
          {icon}
          {label}
        </Link>
      );

    case "min":
      return (
        <Link
          href={path ? `/${path}` : "#"}
          onClick={onSignOut}
          className={cn(
            "flex flex-center gap-2 px-1 py-2 rounded-lg my-1",
            !current
              ? "text-gray-500"
              : current === path
              ? "bg-white font-bold text-black"
              : "text-gray-500"
          )}
        >
          {icon}
        </Link>
      );

    default:
      return null;
  }
};

export default MenuItem;
