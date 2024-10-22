"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Moon, Sun, MessageSquarePlus, Database } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopNavBarProps {
  features?: {
    showDomainSelector?: boolean;
    showViewModeSelector?: boolean;
    showPromptCaching?: boolean;
  };
}

const TopNavBar: React.FC<TopNavBarProps> = ({ features = {} }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="font-bold text-xl flex gap-2 items-center">
            <Image
                src="/logo.png"
                alt="Company Wordmark"
                width={112}
                height={20}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 ml-6">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => {window.location.href = '/';}}
                className={`gap-2 h-9 ${
                  
                        'hover:bg-background'
                }`}
            >
              <MessageSquarePlus className="h-4 w-4" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/database')}
                className={`gap-2 h-9 ${
                    pathname === '/database'
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'hover:bg-background'
                }`}
            >
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
  );
};

export default TopNavBar;