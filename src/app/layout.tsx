import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };

export const metadata: Metadata = {
  title: {
    default: "JEE Tracker — Your Path to IIT",
    template: "%s | JEE Tracker",
  },
  description:
    "Track your JEE preparation progress, analyze readiness, and ace the exam with structured study management.",
  keywords: ["JEE", "IIT", "JEE Main", "JEE Advanced", "Study Tracker", "Exam Preparation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans bg-zinc-950 text-zinc-100 antialiased`}
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#18181b",
              color: "#f4f4f5",
              border: "1px solid #27272a",
              borderRadius: "10px",
              fontSize: "13px",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#18181b",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#18181b",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
