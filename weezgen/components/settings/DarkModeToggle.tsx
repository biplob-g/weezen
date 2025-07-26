"use client"

import { useThemeMode } from "@/hooks/settings/useSettings";
import React from "react";
import Section from "../SectionLabel";
import { cn } from "@/lib/utils";
import SystemMode from "../themes-placeholder/systemMode";

const DarkModeToggle = () => {
  const { setTheme, theme } = useThemeMode();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
<div className="lg:-span-1">
<Section
label="Interface Theme"
message="Select or customize your UI theme"
/>
</div>
<div className="lg:col-span-4 flex lg:flex-row flex-col items-start gap-5">
<div className={cn(
  'rounded-2xl overflow-hidden cursor-pointer border-4 border-transparent',
  theme == 'system' && 'border-orange'
)}
onClick={() => setTheme('system')}
>
<SystemMode/>
</div>
</div>
    </div>
  )
};

export default DarkModeToggle;
