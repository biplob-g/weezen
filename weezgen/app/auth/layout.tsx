import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
};

const Layout = async ({ children }: Props) => {
  const user = await currentUser();

  if (user) redirect("/");
  return (
    <div className="h-screen grid grid-cols-2 py-5 scroll-px-16 max-w-7xl w-full mx-auto">
      <div className="w-[1600px] lg:w-full flex flex-col items-start p-6">
        <Link href="/">
          <Image
            src="https://cdn.worldvectorlogo.com/logos/hubspot.svg"
            alt="logo"
            sizes="100vw"
            style={{
              width: "30%",
              height: "auto",
            }}
            width={0}
            height={0}
          />
        </Link>
        {children}
      </div>
      <div className="hidden lg:flex flex-1 w-full max-h-full max-w-[4000px] overflow-hidden relative bg-cream flex-col pt-10 pl-24 gap-3">
        <h2 className="text-gravel md:text-4xl font-bold">
          Hi, I am your AI powered Sales Assistant, Weezen
        </h2>
        <p className="text-iridium md:text-sm mb-10">
          Weezen is Capable of Capturing lead information without a form.
          Something that has never been done before.
        </p>
        <Image
          src="/images/app-ui.png"
          alt="Sales Agent"
          sizes="30"
          loading="lazy"
          className="absolute shrink-0 !w-[1600px] top-44"
          width={0}
          height={0}
        />
      </div>
    </div>
  );
};

export default Layout;
