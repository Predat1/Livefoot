import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const modes = [
    { key: "light", icon: Sun, label: "Clair", gradient: "from-amber-300 to-orange-500" },
    { key: "system", icon: Monitor, label: "Auto", gradient: "from-slate-400 to-slate-600" },
    { key: "dark", icon: Moon, label: "Sombre", gradient: "from-blue-400 to-indigo-600" },
  ] as const;

  const currentIndex = modes.findIndex((m) => m.key === theme);

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-header-foreground/10 p-0.5">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = theme === mode.key;
        return (
          <button
            key={mode.key}
            onClick={() => setTheme(mode.key)}
            className={cn(
              "relative h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center transition-all duration-300",
              isActive
                ? `bg-gradient-to-br ${mode.gradient} shadow-lg scale-110`
                : "hover:bg-header-foreground/10"
            )}
            aria-label={mode.label}
            title={mode.label}
          >
            <Icon
              className={cn(
                "h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors duration-300",
                isActive ? "text-white" : "text-header-foreground/60"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
