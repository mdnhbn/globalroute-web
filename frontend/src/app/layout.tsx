// Language: TypeScript (React/Next.js) | Target: Next.js Root Layout with RTL & Locale Sync
import type { Metadata } from "next";
import React from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "GlobalRoute — Job Matching, CV Builder & Visa Roadmap",
  description: "Direct career matching, country-specific CV/cover letter builder, and visa/embassy guidance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var loc = window.localStorage.getItem("globalroute_selected_locale") || "en";
                  var clean = String(loc).trim().toLowerCase();
                  var isRtl = clean === "ur" || clean === "ar";
                  document.documentElement.lang = clean || "en";
                  document.documentElement.dir = isRtl ? "rtl" : "ltr";
                } catch (e) {}
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
