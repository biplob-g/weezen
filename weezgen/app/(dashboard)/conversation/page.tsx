import { onGetAllAccountDomains } from "@/actions/auth";
import ConversationMenu from "@/components/conversations";
import Messenger from "@/components/conversations/messenger";
import InfoBars from "@/components/infoBar";
import { Separator } from "@/components/ui/separator";
import React from "react";

type Props = {};

const ConversationPage = async (props: Props) => {
  const domains = await onGetAllAccountDomains();
  return (
    <div className="w-full h-full flex px-5">
      <ConversationMenu domains={domains?.domains} />
      <Separator orientation="vertical" />
      <div className="w-full flex flex-col">
        <div className="px-5">
          <InfoBars />
        </div>
        <Messenger />
      </div>
    </div>
  );
};

export default ConversationPage;
