import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team Task Manager",
  description: "A dynamic, role-based project and task management system.",
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
