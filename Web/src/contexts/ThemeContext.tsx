import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

const isTheme = (value: unknown): value is Theme =>
  value === "light" || value === "dark" || value === "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("cybererp-theme") as Theme) || "system";
  });

  const getResolved = (t: Theme): "light" | "dark" => {
    if (t === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return t;
  };

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(getResolved(theme));

  useEffect(() => {
    const resolved = getResolved(theme);
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    localStorage.setItem("cybererp-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = mq.matches ? "dark" : "light";
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle("dark", resolved === "dark");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  useEffect(() => {
    const resetToSystem = () => setTheme("system");
    window.addEventListener("theme:reset-to-system", resetToSystem);
    return () => window.removeEventListener("theme:reset-to-system", resetToSystem);
  }, []);

  useEffect(() => {
    const applyUserTheme = (event: Event) => {
      const requestedTheme = (event as CustomEvent<unknown>).detail;
      setTheme(isTheme(requestedTheme) ? requestedTheme : "system");
    };
    window.addEventListener("theme:apply-user-setting", applyUserTheme);
    return () => window.removeEventListener("theme:apply-user-setting", applyUserTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
