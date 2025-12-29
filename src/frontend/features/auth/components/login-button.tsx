"use client";

import { Github, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useAuth } from "../hooks";

export const LoginButton = () => {
  const t = useTranslations("auth");
  const { login, loginPending } = useAuth();

  return (
    <Button
      className={cn(
        "relative overflow-hidden border-transparent bg-gradient-to-r from-primary to-primary/80",
        "text-primary-foreground shadow-sm h-10",
        "hover:shadow-md hover:shadow-primary/20 hover:from-primary/90 hover:to-primary/70",
        "hover:bg-transparent hover:text-primary-foreground",
        "active:scale-[0.98] transition-all duration-200"
      )}
      disabled={loginPending}
      onClick={login}
      size="default"
      variant="outline"
    >
      {loginPending ? (
        <Loader2 className="size-4 shrink-0 animate-spin text-primary-foreground/70 sm:mr-1.5" />
      ) : (
        <Github className="size-4 shrink-0 sm:mr-1.5" />
      )}
      <span className="hidden sm:inline">{t("login")}</span>
    </Button>
  );
};
