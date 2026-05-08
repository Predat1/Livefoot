import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  
  // Prevent hydration mismatch - show skeleton while mounting
  if (!mounted) {
    return (
      <div className="flex items-center gap-0.5 rounded-full bg-muted p-0.5">
        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted-foreground/20 animate-pulse" />
        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted-foreground/20 animate-pulse" />
        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted-foreground/20 animate-pulse" />
      </div>
    );
  }

  const modes = [
    { key: "light", icon: Sun, label: "Clair", gradient: "from-amber-300 to-orange-500" },
    { key: "system", icon: Monitor, label: "Système", gradient: "from-slate-400 to-slate-600" },
    { key: "dark", icon: Moon, label: "Sombre", gradient: "from-blue-400 to-indigo-600" },
  ] as const;

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-muted p-0.5 border border-border/50">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = theme === mode.key;
        return (
          <button
            key={mode.key}
            onClick={() => setTheme(mode.key)}
            className={cn(
              "relative h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center transition-all duration-200 ease-out",
              isActive
                ? `bg-gradient-to-br ${mode.gradient} shadow-md scale-105 text-white`
                : "hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground"
            )}
            aria-label={`Thème ${mode.label}${isActive ? ' (actif)' : ''}`}
            title={`Thème ${mode.label}${theme === 'system' && mode.key === 'system' ? ` (${resolvedTheme === 'dark' ? 'sombre' : 'clair'})` : ''}`}
            aria-pressed={isActive}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {isActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current opacity-50" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
