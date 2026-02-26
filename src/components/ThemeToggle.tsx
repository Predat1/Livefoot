import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative h-9 w-16 sm:h-10 sm:w-[72px] rounded-full p-1 transition-colors duration-500 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isDark
          ? "bg-header-foreground/10"
          : "bg-header-foreground/10"
      )}
      aria-label="Toggle theme"
    >
      {/* Track icons */}
      <Sun className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 transition-opacity duration-300" style={{ opacity: isDark ? 0.3 : 1 }} />
      <Moon className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-300 transition-opacity duration-300" style={{ opacity: isDark ? 1 : 0.3 }} />

      {/* Sliding thumb */}
      <span
        className={cn(
          "block h-7 w-7 sm:h-8 sm:w-8 rounded-full shadow-lg transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]",
          isDark
            ? "translate-x-[28px] sm:translate-x-8 bg-gradient-to-br from-blue-400 to-indigo-600"
            : "translate-x-0 bg-gradient-to-br from-amber-300 to-orange-500"
        )}
      >
        <span className={cn(
          "flex h-full w-full items-center justify-center transition-transform duration-500",
          isDark ? "rotate-0" : "rotate-[360deg]"
        )}>
          {isDark ? (
            <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
          ) : (
            <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
          )}
        </span>
      </span>
    </button>
  );
};

export default ThemeToggle;
