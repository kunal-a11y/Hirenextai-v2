import { create } from "zustand";
import { useQueryClient } from "@tanstack/react-query";
import { useLogin, useRegister, useGetMe, getGetMeQueryKey, type User } from "@workspace/api-client-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useDemoStore } from "@/store/demo";

interface AuthState {
  token: string | null;
  setToken: (token: string | null) => void;
  clearStore: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("hirenext_token") : null,
  setToken: (token) => {
    if (token) {
      localStorage.setItem("hirenext_token", token);
    } else {
      localStorage.removeItem("hirenext_token");
    }
    set({ token });
  },
  clearStore: () => {
    localStorage.removeItem("hirenext_token");
    set({ token: null });
  },
}));

function clearAllAuthStorage() {
  // localStorage
  localStorage.removeItem("hirenext_token");

  // sessionStorage — clear everything (no sensitive cross-tab bleed)
  try { sessionStorage.clear(); } catch (_) {}

  // Cookies — expire any hirenext_ prefixed cookies on all paths
  try {
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      if (name.startsWith("hirenext_") || name === "token") {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    });
  } catch (_) {}
}

async function callServerLogout(token: string | null) {
  if (!token) return;
  try {
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    await fetch(`${base}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (_) {
    // fire-and-forget — network errors must not block client logout
  }
}

export function useAuth() {
  const { token, setToken, clearStore } = useAuthStore();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading: isUserLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      staleTime: 30000,
    }
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        // Always clear any leftover demo keys so a real token is never masked by isDemoMode
        useDemoStore.getState().disableDemo();
        useDemoStore.getState().clearExpired();
        setToken(data.token);
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        // Admin → admin panel; recruiter → recruiter dashboard; job seeker → jobs
        const role = data.user.role;
        setLocation(role === "admin" ? "/dashboard/admin" : role === "recruiter" ? "/dashboard/recruiter" : "/dashboard/jobs");
      }
    }
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        // Same: clear demo state on register so fresh real session starts clean
        useDemoStore.getState().disableDemo();
        useDemoStore.getState().clearExpired();
        setToken(data.token);
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        const role = data.user.role;
        setLocation(role === "admin" ? "/dashboard/admin" : role === "recruiter" ? "/dashboard/recruiter" : "/dashboard/jobs");
      }
    }
  });

  useEffect(() => {
    if (error && token) {
      clearStore();
      queryClient.removeQueries({ queryKey: getGetMeQueryKey() });
      setLocation("/login");
    }
  }, [error, token, clearStore, queryClient, setLocation]);

  const logout = async () => {
    // 1. Hit backend (invalidate server-side session / blacklist if applicable)
    await callServerLogout(token);

    // 2. Wipe all client-side auth data
    clearAllAuthStorage();
    clearStore();

    // 3. Purge all cached React Query data
    queryClient.clear();

    // Caller is responsible for showing toast and redirect
  };

  return {
    user: user as User | undefined,
    token,
    isLoading: isUserLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout,
  };
}
