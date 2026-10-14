import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { CartProvider } from "@/components/CartProvider";
import Header from "@/components/Header";
import "./globals.css";
import { cn } from "@/lib/utils";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dishpatch · Food delivery",
  description: "Order your favourite food and track it live until it reaches your door.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn(display.variable, body.variable, "font-sans")}>
      <body>
        <CartProvider>
          <Header />
          <main className="mx-auto w-full max-w-6xl px-4 py-7 pb-24">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
