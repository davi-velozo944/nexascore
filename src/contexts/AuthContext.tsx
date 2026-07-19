import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Stripe product IDs mapped to plan names
export const PLAN_TIERS = {
  inicial: {
    product_id: "prod_UlrEULDz0Z9AWT",
    price_id: "price_1TmJVkI0U16J9fR49jQ4i0Pt",
    name: "Inicial",
  },
  profissional: {
    product_id: "prod_UlrEBo03U04T0m",
    price_id: "price_1TmJVlI0U16J9fR4wmJ6eNkx",
    name: "Profissional",
  },
  premium: {
    product_id: "prod_UlrE099XkylIo4",
    price_id: "price_1TmJVmI0U16J9fR44wtWuFwN",
    name: "Premium",
  },
} as const;

// Plan quotas configuration
export interface PlanQuota {
  clients: number;
  contracts: number;
  employees: number;
  positions: number;
  importsPerMonth: number;
  aiAnalysis: boolean;
  reports: boolean;
  conciliation: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
}

export const PLAN_QUOTAS: Record<string, PlanQuota> = {
  free: {
    clients: 5,
    contracts: 3,
    employees: 5,
    positions: 3,
    importsPerMonth: 1,
    aiAnalysis: false,
    reports: false,
    conciliation: false,
    whiteLabel: false,
    apiAccess: false,
  },
  inicial: {
    clients: 50,
    contracts: 10,
    employees: 20,
    positions: 10,
    importsPerMonth: 5,
    aiAnalysis: true,
    reports: true,
    conciliation: true,
    whiteLabel: false,
    apiAccess: false,
  },
  profissional: {
    clients: 200,
    contracts: 50,
    employees: 100,
    positions: 30,
    importsPerMonth: 20,
    aiAnalysis: true,
    reports: true,
    conciliation: true,
    whiteLabel: false,
    apiAccess: false,
  },
  premium: {
    clients: Infinity,
    contracts: Infinity,
    employees: Infinity,
    positions: Infinity,
    importsPerMonth: Infinity,
    aiAnalysis: true,
    reports: true,
    conciliation: true,
    whiteLabel: true,
    apiAccess: true,
  },
};

interface SubscriptionStatus {
  subscribed: boolean;
  productId: string | null;
  planName: string | null;
  planKey: string;
  subscriptionEnd: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: SubscriptionStatus;
  quota: PlanQuota;
  signUp: (email: string, password: string, metadata?: { company_name?: string; responsible_name?: string; tax_id?: string; tax_id_type?: "cpf" | "cnpj" }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
  canAdd: (resource: keyof Pick<PlanQuota, "clients" | "contracts" | "employees" | "positions">, currentCount: number) => boolean;
  getUpgradePlan: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    subscribed: false,
    productId: null,
    planName: null,
    planKey: "free",
    subscriptionEnd: null,
  });

  const getPlanKey = (productId: string | null): string => {
    if (!productId) return "free";
    for (const [key, tier] of Object.entries(PLAN_TIERS)) {
      if (tier.product_id === productId) return key;
    }
    return "free";
  };

  const getPlanName = (productId: string | null): string | null => {
    if (!productId) return "Grátis";
    for (const tier of Object.values(PLAN_TIERS)) {
      if (tier.product_id === productId) return tier.name;
    }
    return "Grátis";
  };

  const quota = PLAN_QUOTAS[subscription.planKey] || PLAN_QUOTAS.free;

  const canAdd = useCallback(
    (resource: keyof Pick<PlanQuota, "clients" | "contracts" | "employees" | "positions">, currentCount: number) => {
      const limit = quota[resource];
      return currentCount < limit;
    },
    [quota]
  );

  const getUpgradePlan = useCallback(() => {
    const order = ["free", "inicial", "profissional", "premium"];
    const currentIndex = order.indexOf(subscription.planKey);
    if (currentIndex < order.length - 1) return order[currentIndex + 1];
    return "premium";
  }, [subscription.planKey]);

  const checkSubscription = async () => {
    if (!session?.access_token) {
      setSubscription({
        subscribed: false,
        productId: null,
        planName: "Grátis",
        planKey: "free",
        subscriptionEnd: null,
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Error checking subscription:", error);
        // On error, default to free plan (don't block the user)
        setSubscription({
          subscribed: false,
          productId: null,
          planName: "Grátis",
          planKey: "free",
          subscriptionEnd: null,
        });
        return;
      }

      const planKey = getPlanKey(data?.product_id);
      const planName = getPlanName(data?.product_id);
      setSubscription({
        subscribed: data?.subscribed || false,
        productId: data?.product_id || null,
        planName,
        planKey,
        subscriptionEnd: data?.subscription_end || null,
      });
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscription({
        subscribed: false,
        productId: null,
        planName: "Grátis",
        planKey: "free",
        subscriptionEnd: null,
      });
    }
  };

  useEffect(() => {
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => authSubscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      checkSubscription();
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    // Realtime: update plan instantly when webhook updates profile
    const channel = supabase
      .channel(`profile-plan-${session.user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${session.user.id}` },
        () => { checkSubscription(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const signUp = async (
    email: string,
    password: string,
    metadata?: { company_name?: string; responsible_name?: string; tax_id?: string; tax_id_type?: "cpf" | "cnpj" }
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata,
      },
    });

    if (!error && metadata) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({
          company_name: metadata.company_name,
          responsible_name: metadata.responsible_name,
          tax_id: metadata.tax_id,
          tax_id_type: metadata.tax_id_type,
        }).eq("user_id", user.id);
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscription({
      subscribed: false,
      productId: null,
      planName: "Grátis",
      planKey: "free",
      subscriptionEnd: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        subscription,
        quota,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        checkSubscription,
        canAdd,
        getUpgradePlan,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
