import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Star,
  Trophy,
  Zap,
} from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand={false}
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl group-[.toaster]:px-4 group-[.toaster]:py-3",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:font-bold group-[.toast]:text-xs",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          title: "group-[.toast]:font-bold group-[.toast]:text-sm",
          success:
            "group-[.toaster]:border-primary/30 group-[.toaster]:bg-primary/5",
          error:
            "group-[.toaster]:border-destructive/30 group-[.toaster]:bg-destructive/5",
          warning:
            "group-[.toaster]:border-amber-500/30 group-[.toaster]:bg-amber-500/5",
          info:
            "group-[.toaster]:border-blue-500/30 group-[.toaster]:bg-blue-500/5",
        },
      }}
      {...props}
    />
  );
};

// ─── Custom toast helpers with branded icons ──────────────────

const livefootToast = {
  success: (title: string, description?: string) =>
    toast.success(title, {
      description,
      icon: <CheckCircle2 className="h-5 w-5 text-primary" />,
    }),

  error: (title: string, description?: string) =>
    toast.error(title, {
      description,
      icon: <XCircle className="h-5 w-5 text-destructive" />,
    }),

  warning: (title: string, description?: string) =>
    toast.warning(title, {
      description,
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    }),

  info: (title: string, description?: string) =>
    toast.info(title, {
      description,
      icon: <Info className="h-5 w-5 text-blue-500" />,
    }),

  favorite: (name: string, added: boolean) =>
    toast(added ? "Ajouté aux favoris" : "Retiré des favoris", {
      description: name,
      icon: (
        <Star
          className={`h-5 w-5 transition-colors ${
            added ? "fill-primary text-primary" : "text-muted-foreground"
          }`}
        />
      ),
    }),

  goal: (player: string, team: string) =>
    toast("⚽ BUT !", {
      description: `${player} marque pour ${team}`,
      icon: <Zap className="h-5 w-5 text-primary" />,
    }),

  prediction: (title: string, description?: string) =>
    toast(title, {
      description,
      icon: <Trophy className="h-5 w-5 text-primary" />,
    }),
};

export { Toaster, toast, livefootToast };
