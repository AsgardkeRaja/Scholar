import type { Metadata } from "next";
import { Hanken_Grotesk, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/header";
import Silk from "@/components/Silk";
import { AuthProvider } from "@/contexts/auth-context";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-headline",
  display: "swap",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "The research — Academic Excellence in AI",
  description: "Find, explore, and summarize research papers and scholarly articles with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          hankenGrotesk.variable,
          sourceSerif4.variable,
          "font-body antialiased min-h-screen bg-background"
        )}
        suppressHydrationWarning
      >
        <AuthProvider>
          {/* Breathing aura gradients — global animated backdrop */}
          <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="aura-bg aura-violet w-[800px] h-[800px] -top-[200px] -left-[200px]" />
            <div className="aura-bg aura-blue w-[600px] h-[600px] top-[40%] -right-[100px]" style={{ animationDelay: '3s' }} />
            <div className="aura-bg aura-emerald w-[500px] h-[500px] -bottom-[100px] left-[20%]" style={{ animationDelay: '6s' }} />
          </div>

          {/* Silk shader background — layered above auras */}
          <div className="fixed inset-0 -z-10 opacity-60" suppressHydrationWarning>
            <Silk
              speed={5}
              scale={1}
              color="#3d3347"
              noiseIntensity={1.5}
              rotation={0}
            />
          </div>

          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 pt-2">{children}</main>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
