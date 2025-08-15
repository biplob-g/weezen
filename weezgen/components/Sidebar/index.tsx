"use client";

import React from "react";
import useSidebar from "./useSidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SIDE_BAR_MENU } from "@/constants/menu";
import { LogOut, Moon, Sun, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useDomain } from "@/hooks/sidebar/useDomain";
import { FieldValues, UseFormRegister } from "react-hook-form";
import AppDrawer from "../drawer/AppDrawer";
import { Plus } from "lucide-react";
import { Loader } from "../loader";
import FormGenerator from "../forms/SignUp/formGenerator";
import UploadButton from "../uploadButton";
import { Button } from "../ui/button";
import { useTheme } from "next-themes";

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

// Domain Menu Component
const DomainMenu = ({ domains }: { domains: Props["domains"] }) => {
  const { register, onAddDomain, loading, errors, isDomain } = useDomain();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between w-full items-center">
        <AppDrawer
          description="Add in you domain address to integrate your chatbot"
          title="Add you business domain"
          onOpen={
            <div className="cursor-pointer text-muted-foreground rounded-full border-2 border-border p-1 hover:bg-accent hover:text-accent-foreground transition-colors">
              <Plus className="w-4 h-4" />
            </div>
          }
        >
          <Loader loading={loading}>
            <form
              onSubmit={onAddDomain}
              className="mt-3 w-6/12 flex flex-col gap-3"
            >
              <FormGenerator
                inputType="input"
                register={register as unknown as UseFormRegister<FieldValues>}
                label="Domain"
                name="domain"
                errors={errors}
                placeholder="mydomain.com"
                type="text"
              />
              <UploadButton
                register={register as unknown as UseFormRegister<FieldValues>}
                label="Upload Icon"
                errors={errors}
              />
              <Button type="submit" className="w-full cursor-pointer">
                Add Domain
              </Button>
            </form>
          </Loader>
        </AppDrawer>
      </div>

      <SidebarMenu>
        {domains?.map((domain) => (
          <SidebarMenuItem key={domain.id}>
            <SidebarMenuButton
              asChild
              isActive={domain.name.split(".")[0] === isDomain}
              tooltip={domain.name}
            >
              <Link href={`/settings/${domain.name.split(".")[0]}`}>
                {domain.icon ? (
                  <Image
                    src={`https://ucarecdn.com/${domain.icon}/`}
                    alt="logo"
                    width={20}
                    height={20}
                  />
                ) : (
                  <div className="w-5 h-5 bg-primary rounded" />
                )}
                <span className="text-sm">{domain.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </div>
  );
};

function SideBar({ domains }: Props) {
  const { page, onSignOut } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [showProfile, setShowProfile] = React.useState(false);

  React.useEffect(() => {
    if (showProfile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [showProfile]);

  return (
    <>
      <Sidebar className="border-r bg-background" collapsible="icon">
        <SidebarHeader className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-foreground">Weezen</div>
            <SidebarTrigger />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>MENU</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {SIDE_BAR_MENU.map((menu, key) => (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton
                      asChild
                      isActive={page === menu.path}
                      tooltip={menu.label}
                    >
                      <Link href={`/${menu.path}`}>
                        {menu.icon}
                        <span>{menu.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>DOMAINS</SidebarGroupLabel>
            <SidebarGroupContent>
              <DomainMenu domains={domains} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border p-4 ml-[-12px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="h-8 w-8"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowProfile(true)}
                className="h-8 w-8"
              >
                <User className="h-4 w-4" />
                <span className="sr-only">User profile</span>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSignOut}
              className="h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}

export default SideBar;
