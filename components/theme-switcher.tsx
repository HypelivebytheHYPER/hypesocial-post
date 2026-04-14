"use client";

import { useEffect, useState } from "react";
import { Check, Moon, Sun, Palette, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import {
  TweakCNThemeName,
  applyTweakCNThemeToDocument,
  clearTweakCNTheme,
  getAvailableThemes,
  getThemePreviewColors,
  tweakcnThemes,
} from "@/lib/themes/tweakcn";

// Theme icon/color mapping
const themeMeta: Record<TweakCNThemeName, { icon: string; gradient: string }> = {
  arco: {
    icon: "🔷",
    gradient: "from-blue-500 to-blue-600",
  },
  ocean: {
    icon: "🌊",
    gradient: "from-sky-400 to-cyan-500",
  },
  midnight: {
    icon: "🌙",
    gradient: "from-violet-600 to-purple-700",
  },
  nature: {
    icon: "🌿",
    gradient: "from-emerald-500 to-green-600",
  },
  sunset: {
    icon: "🌅",
    gradient: "from-orange-500 to-rose-500",
  },
  mono: {
    icon: "⬛",
    gradient: "from-gray-700 to-gray-900",
  },
};

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [currentTweakCN, setCurrentTweakCN] = useState<TweakCNThemeName | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load saved theme from localStorage
    const saved = localStorage.getItem("tweakcn-theme") as TweakCNThemeName | null;
    if (saved && tweakcnThemes[saved]) {
      setCurrentTweakCN(saved);
      applyTweakCNThemeToDocument(saved);
    }
  }, []);

  const handleTweakCNChange = (themeName: TweakCNThemeName) => {
    applyTweakCNThemeToDocument(themeName);
    setCurrentTweakCN(themeName);
    localStorage.setItem("tweakcn-theme", themeName);
  };

  const clearTweakCN = () => {
    clearTweakCNTheme();
    setCurrentTweakCN(null);
    localStorage.removeItem("tweakcn-theme");
  };

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
  };

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="h-9 w-9">
        <Palette className="h-4 w-4" />
      </Button>
    );
  }

  const themes = getAvailableThemes();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 relative">
          {currentTweakCN && themeMeta[currentTweakCN] ? (
            <span className="text-lg">{themeMeta[currentTweakCN].icon}</span>
          ) : resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          {currentTweakCN && themeMeta[currentTweakCN] && (
            <span
              className={cn(
                "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900",
                "bg-gradient-to-r",
                themeMeta[currentTweakCN].gradient
              )}
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Mode</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => handleThemeChange("light")}
            className="flex items-center gap-3"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white to-gray-100 border flex items-center justify-center">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <span className="flex-1">Light</span>
            {resolvedTheme === "light" && !currentTweakCN && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleThemeChange("dark")}
            className="flex items-center gap-3"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border flex items-center justify-center">
              <Moon className="w-3.5 h-3.5 text-slate-300" />
            </div>
            <span className="flex-1">Dark</span>
            {resolvedTheme === "dark" && !currentTweakCN && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Themes</DropdownMenuLabel>
        <DropdownMenuGroup>
          {themes.map((t) => {
            const colors = getThemePreviewColors(t.name);
            const meta = themeMeta[t.name];
            const isActive = currentTweakCN === t.name;

            if (!meta) return null;

            return (
              <DropdownMenuItem
                key={t.name}
                onClick={() => handleTweakCNChange(t.name)}
                className={cn(
                  "flex items-center gap-3 py-2.5",
                  isActive && "bg-accent"
                )}
              >
                {/* Theme Preview Swatch */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg shadow-sm flex items-center justify-center text-sm",
                    "bg-gradient-to-br",
                    meta.gradient
                  )}
                >
                  <span className="drop-shadow-md">{meta.icon}</span>
                </div>

                {/* Theme Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {t.description}
                  </div>
                </div>

                {/* Active Indicator */}
                {isActive && <Check className="w-4 h-4 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        {currentTweakCN && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={clearTweakCN}
              className="flex items-center gap-3 text-muted-foreground"
            >
              <div className="w-8 h-8 rounded-lg border border-dashed flex items-center justify-center">
                <X className="w-4 h-4" />
              </div>
              <span>Reset to default</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Theme Preview Card Component (can be used in settings page)
export function ThemePreviewCard({
  themeName,
  isActive,
  onClick,
}: {
  themeName: TweakCNThemeName;
  isActive: boolean;
  onClick: () => void;
}) {
  const theme = tweakcnThemes[themeName];
  const meta = themeMeta[themeName];
  const colors = getThemePreviewColors(themeName);

  if (!theme || !meta) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col gap-2 rounded-xl border-2 p-3 text-left transition-all",
        isActive
          ? "border-primary bg-accent"
          : "border-border bg-card hover:border-muted-foreground/50"
      )}
    >
      {/* Preview Area */}
      <div
        className={cn(
          "h-16 rounded-lg bg-gradient-to-br",
          meta.gradient
        )}
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-2xl drop-shadow-lg">{meta.icon}</span>
        </div>
      </div>

      {/* Info */}
      <div>
        <div className="font-medium">{theme.name}</div>
        <div className="text-xs text-muted-foreground line-clamp-1">
          {theme.description}
        </div>
      </div>

      {/* Color Dots */}
      <div className="flex gap-1.5">
        <div
          className="w-4 h-4 rounded-full border"
          style={{ backgroundColor: colors.primary }}
        />
        <div
          className="w-4 h-4 rounded-full border"
          style={{ backgroundColor: colors.secondary }}
        />
        <div
          className="w-4 h-4 rounded-full border"
          style={{ backgroundColor: colors.accent }}
        />
      </div>

      {/* Active Check */}
      {isActive && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
    </button>
  );
}
