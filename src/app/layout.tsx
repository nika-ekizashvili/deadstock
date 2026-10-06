import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DEADSTOCK",
  description: "Tbilisi's Instagram thrift shops in one place",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka">
      <body>{children}</body>
    </html>
  );
}
