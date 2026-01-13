import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mosaic - Math Python Environment",
  description: "A sandbox environment for mathematical computing and exploration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
