import { SIDE_BAR_MENU } from "@/constants/menu";
import { LogOut, Menu, MonitorSmartphone } from "lucide-react";
import React from "react";
import DomainMenu from "./domainMenu";
import MenuItem from "./menuItems";

type Props = {
  onExpand(): void;
  current: string | undefined;
  onSignOut(): void;
  domains:
    | {
        id: string;
        name: string;
        icon: string | null;
      }[]
    | null
    | undefined;
};

const MinMenu = ({ onExpand, current, onSignOut, domains }: Props) => {
  return (
    <div className="py-3 px-2 flex flex-col h-full">
      <div className="flex justify-center items-center mb-4">
        <div className="text-lg font-bold text-gray-800">W</div>
      </div>

      <div className="flex justify-center mb-4">
        <Menu
          className="cursor-pointer hover:text-gray-600"
          onClick={onExpand}
          size={20}
        />
      </div>

      <div className="flex flex-col justify-between h-full">
        <div className="flex flex-col items-center gap-2">
          {SIDE_BAR_MENU.map((menu, key) => (
            <MenuItem size="min" {...menu} key={key} current={current} />
          ))}
          <DomainMenu domains={domains} min />
        </div>

        <div className="flex flex-col items-center gap-2">
          <MenuItem
            size="min"
            label="Sign Out"
            icon={<LogOut size={20} />}
            onSignOut={onSignOut}
          />
          <MenuItem
            size="min"
            label="Mobile App"
            icon={<MonitorSmartphone size={20} />}
          />
        </div>
      </div>
    </div>
  );
};

export default MinMenu;
