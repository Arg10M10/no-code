import { useEffect } from "react";
import { storage } from "@/lib/storage";

const THEME_KEY = "app-theme";
const REDUCED_MOTION_KEY = "reduced-motion";
type Theme = "system" | "light" | "dark";

export const ThemeInitializer = () => {
  useEffect(() => {
    const apply = () => {
      const theme = storage.getJSON<Theme>(THEME_KEY, "system");
      const reducedMotion = storage.getJSON<boolean>(REDUCED_MOTION_KEY, false);
      const root = window.document.documentElement;

      root.classList.remove("light", "dark");

      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }

      if (reducedMotion) {
        root.classList.add("motion-reduce");
      } else {
        root.classList.remove("motion-reduce");
      }
    };

    // Aplicar inmediatamente al montar
    apply();

    // Escuchar cambios en la preferencia del sistema si el tema es "system"
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
        if (storage.getJSON<Theme>(THEME_KEY, "system") === "system") {
            apply();
        }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  return null;
};