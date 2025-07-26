"use client";

import React from "react";
import BreadCrumb from "./BreadCrumb";
import { Card } from "../ui/card";
import { Headphones, Star, Trash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const InfoBars = () => {
  return (
    <div className="flex w-full justify-center items-center py-3 mb-8">
      <BreadCrumb />
      <div className="flex gap-3 items-center">
        <div className="flex">
          <Card className="rounded-xl flex flex-row gap-3 py-3 px-4 text-gray-500">
            <Trash />
            <Star />
          </Card>

          <Avatar className="flex flex-row">
            <AvatarFallback
              className="bg-orange-400 text-white
        "
            >
              <Headphones />
            </AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarImage src="https://github.com/shadcn/png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
};

export default InfoBars;
