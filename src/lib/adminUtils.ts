// ═══════════════════════════════════════════════════════════════
// Admin Utils - Shared admin constants and helpers
// Break circular dependency between Users.tsx and UserDetailDrawer
// ═══════════════════════════════════════════════════════════════

import { Shield, ShieldCheck, UserCog } from "lucide-react";

export const ROLE_CONFIG = {
  admin: {
    label: "Admin",
    icon: Shield,
    color: "bg-destructive/10 text-destructive border-destructive/30",
  },
  moderator: {
    label: "Modérateur",
    icon: ShieldCheck,
    color: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  },
  user: {
    label: "Utilisateur",
    icon: UserCog,
    color: "bg-primary/10 text-primary border-primary/30",
  },
};

export type UserRole = keyof typeof ROLE_CONFIG;
