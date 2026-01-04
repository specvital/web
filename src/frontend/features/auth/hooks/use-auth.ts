"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { authKeys } from "@/lib/api/error-handler";
import type { UserInfo } from "@/lib/api/types";

import { fetchCurrentUser, fetchLogin, fetchLogout } from "../api";

type UseAuthReturn = {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  loginPending: boolean;
  logout: () => void;
  logoutPending: boolean;
  user: UserInfo | null;
};

const checkSessionCookie = (): boolean => {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("has_session=1");
};

export const useAuth = (): UseAuthReturn => {
  const queryClient = useQueryClient();
  const pathname = usePathname();

  // Prevent hydration mismatch: check cookie only on client
  // Re-check on pathname change to detect cookie changes during SPA navigation
  const [hasSession, setHasSession] = useState(false);
  useEffect(() => {
    setHasSession(checkSessionCookie());
  }, [pathname]);

  const userQuery = useQuery({
    enabled: hasSession,
    queryFn: fetchCurrentUser,
    queryKey: authKeys.user(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: fetchLogin,
    onError: () => toast.error("Failed to start login process"),
    onSuccess: (data) => {
      window.location.href = data.authUrl;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: fetchLogout,
    onSuccess: () => {
      document.cookie = "has_session=; path=/; max-age=0";
      queryClient.setQueryData(authKeys.user(), null);
      window.location.href = "/";
    },
  });

  const isLoading = userQuery.isFetching;

  return {
    isAuthenticated: !!userQuery.data,
    isLoading,
    login: () => loginMutation.mutate(),
    loginPending: loginMutation.isPending,
    logout: () => logoutMutation.mutate(),
    logoutPending: logoutMutation.isPending,
    user: userQuery.data ?? null,
  };
};
