import "@/styles/globals.css";
import type { Metadata } from "next";
import { geist } from "@/configs/font";
import NextThemeProvider from "@/components/context/next-themes";
import TanstackQueryProvider from "@/components/context/tanstack-query";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Technostock - Platform Edukasi Trading Saham",
  description: "Platform edukasi trading saham terdepan di Indonesia.",
};

export default function GlobalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${geist.className} overflow-x-hidden antialiased`}>
        <NextThemeProvider>
          <TanstackQueryProvider>
            {children}
            <Toaster position="top-center" />
          </TanstackQueryProvider>
        </NextThemeProvider>
      </body>
    </html>
  );
}
