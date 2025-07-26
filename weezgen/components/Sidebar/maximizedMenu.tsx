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

const MaxMenu = ({ onExpand, current, onSignOut, domains }: Props) => {
  return (
    <div className="py-3 px-4 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <div className="text-xl font-bold text-gray-800">Weezen</div>

        <Menu
          className="cursor-pointer hover:text-gray-600"
          onClick={onExpand}
        />
      </div>
      <div className="flex flex-col justify-between h-full pt-10">
        <div className="flex flex-col">
          <p className="text-xs text-gray-500 mb-3">MENU</p>
          {SIDE_BAR_MENU.map((menu, key) => (
            <MenuItem size="max" {...menu} key={key} current={current} />
          ))}
          <DomainMenu domains={domains} />
        </div>
        <div className="flex flex-col">
          <p className="text-xs text-gray-500 mb-3">OPTIONS</p>
          <MenuItem
            size="max"
            label="Sign Out"
            icon={<LogOut />}
            onSignOut={onSignOut}
          />
          <MenuItem
            size="max"
            label="Mobile App"
            icon={<MonitorSmartphone />}
          />
        </div>
      </div>
    </div>
  );
};

export default MaxMenu;
