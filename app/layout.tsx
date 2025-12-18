import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sky Cavalry Clash",
  description:
    "Arcade aerial game featuring four flying horsemen soaring through the clouds."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
