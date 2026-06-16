import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ForgeGuard | Autonomous Firebase Security",
  description: "Production-grade Firebase rules with zero security blind spots.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${inter.variable} font-sans antialiased tracking-wide relative`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {/* Subtle colorful top border across all pages */}
          <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-500 via-rose-500 to-indigo-500 z-[100] opacity-80" />
          
          {/* Very subtle ambient background glow */}
          <div className="fixed top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-r from-orange-500/5 via-rose-500/5 to-indigo-500/5 blur-[120px] pointer-events-none -z-10" />

          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
