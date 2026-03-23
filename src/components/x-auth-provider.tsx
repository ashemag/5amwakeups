"use client";

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { getXProfile, type XProfile } from "@/lib/x-profile";

type XAuthContextValue = {
  isAuthenticating: boolean;
  isLoading: boolean;
  profile: XProfile | null;
  session: Session | null;
  signInWithX: () => Promise<void>;
  signOut: () => Promise<void>;
  user: User | null;
};

const XAuthContext = createContext<XAuthContextValue | null>(null);

export function XAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let active = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Supabase session load failed", error);
      }

      if (!active) {
        return;
      }

      startTransition(() => {
        setSession(data.session ?? null);
        setIsLoading(false);
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) {
        return;
      }

      startTransition(() => {
        setSession(nextSession);
        setIsLoading(false);

        if (event !== "INITIAL_SESSION") {
          setIsAuthenticating(false);
        }
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithX = async () => {
    const supabase = createBrowserSupabaseClient();
    setIsAuthenticating(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "x",
    });

    if (error) {
      setIsAuthenticating(false);
      throw error;
    }
  };

  const signOut = async () => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  };

  const value = useMemo<XAuthContextValue>(() => {
    const user = session?.user ?? null;

    return {
      isAuthenticating,
      isLoading,
      profile: getXProfile(user),
      session,
      signInWithX,
      signOut,
      user,
    };
  }, [isAuthenticating, isLoading, session]);

  return <XAuthContext.Provider value={value}>{children}</XAuthContext.Provider>;
}

export function useXAuth() {
  const context = useContext(XAuthContext);

  if (!context) {
    throw new Error("useXAuth must be used inside XAuthProvider");
  }

  return context;
}
