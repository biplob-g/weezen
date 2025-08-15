"use client";

import Section from "@/components/SectionLabel";
import { Copy, Check } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

type Props = {
  id: string;
};

const CodeSnippet = ({ id }: Props) => {
  const [copied, setCopied] = useState(false);

  let snippet = `
    const iframe = document.createElement("iframe");

    const iframeStyles = (styleString) => {
      const style = document.createElement('style');
      style.textContent = styleString;
      document.head.append(style);
    }

    iframeStyles('
      .chat-frame {
        position: fixed;
        bottom: 50px;
        right: 50px;
        border: none;
      }
    ')

    iframe.src = "http://localhost:3000/chatbot"
    iframe.classList.add('chat-frame')
    document.body.appendChild(iframe)

    window.addEventListener("message", (e) => {
      if(e.origin !== "http://localhost:3000/") return null
      let dimensions = JSON.parse(e.data)
            iframe.width = dimensions.width
      iframe.height = dimensions.height
      iframe.contentWindow.postMessage("${id}", "http://localhost:3000/")
    })
  `;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast("Copied to Clipboard", {
      description: "You can now paste the code into your website",
    });
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="mt-10 flex flex-col gap-5 items-start">
      <Section
        label="Code snippet"
        message="Copy and paste this code snipped into the header tag of your website"
      />
      <div className="bg-muted px-10 rounded-lg inline-block relative">
        {copied ? (
          <Check className="text-gray-600 absolute top-4 right-4" />
        ) : (
          <Copy
            className="cursor-pointer absolute top-4 right-4"
            onClick={handleCopy}
          />
        )}
        <pre>
          <code className="text-gray-600">{snippet}</code>
        </pre>
      </div>
    </div>
  );
};

export default CodeSnippet;
