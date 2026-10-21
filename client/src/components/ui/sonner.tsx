import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

// Wired to the app's own palette. The shadcn default pointed at --popover and
// --popover-foreground, which this project never defines, so every toast drew
// on a transparent background; and it followed the OS theme into dark mode in
// an app that has no dark appearance.
const Toaster = ({ ...props }: ToasterProps) => {
  // Toasts portal to <body>, which is RTL by default; without this an English
  // toast laid itself out right-to-left and reordered its numbers.
  const { isRTL } = useLanguage();
  return (
    <Sonner
      theme="light"
      dir={isRTL ? "rtl" : "ltr"}
      // Top-centre: symmetric in both scripts, and clear of the tab bar that a
      // bottom toast sat on top of.
      position="top-center"
      offset={{ top: "calc(64px + env(safe-area-inset-top, 0px))" }}
      mobileOffset={{ top: "calc(64px + env(safe-area-inset-top, 0px))", left: 16, right: 16 }}
      className="toaster group"
      style={
        {
          "--normal-bg": "#FFFFFF",
          "--normal-text": "#1B2E5E",
          "--normal-border": "var(--border, #D0DFF0)",
          "--success-bg": "#FFFFFF",
          "--success-text": "#15803D",
          "--success-border": "#BBE5C8",
          "--error-bg": "#FFFFFF",
          "--error-text": "#B91C1C",
          "--error-border": "#F3B4B4",
          "--border-radius": "14px",
          fontFamily: "inherit",
        } as React.CSSProperties
      }
      toastOptions={{
        style: { boxShadow: "0 8px 32px rgba(27,46,94,0.18)", fontFamily: "inherit" },
        descriptionClassName: "pf-toast-desc",
      }}
      {...props}
    />
  );
};

export { Toaster };
