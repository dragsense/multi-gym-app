import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ICustomTooltipProps {
  text: string;
  trimCount?: number;
  className?: string;
}

export const CustomTooltip: React.FC<ICustomTooltipProps> = ({
  text,
  trimCount,
  className,
}) => {
  if (!text) {
    return <span className={className}>-</span>;
  }

  const isTrimmed = trimCount !== undefined && text.length > trimCount;
  const displayText = isTrimmed ? `${text.substring(0, trimCount)}...` : text;

  if (!isTrimmed) {
    return <span className={className}>{displayText}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("cursor-pointer", className)}>{displayText}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs break-words" side="right">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
