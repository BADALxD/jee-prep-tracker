import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = { variable: "--font-geist-sans" };
const geistMono = { variable: "--font-geist-mono" };

export const metadata: Metadata = {
  metadataBase: new URL("https://jee-prep-tracker-woad.vercel.app"),

  applicationName: "JEE Tracker",

  title: {
    default: "JEE Tracker — Your Path to IIT",
    template: "%s | JEE Tracker",
  },

  description:
    "Free JEE Main and JEE Advanced preparation tracker with chapter progress tracking, revision planning, readiness analysis, and performance insights.",

  openGraph: {
  title: "JEE Tracker",
  description:
    "Free JEE Main and JEE Advanced preparation tracker with chapter progress tracking, revision planning, readiness analysis, and performance insights.",
  siteName: "JEE Tracker",
  type: "website",
  images: [
    {
      url: "/og-image.png",
      width: 1024,
      height: 1024,
      alt: "JEE Tracker",
    },
  ],
},
twitter: {
  card: "summary_large_image",
  title: "JEE Tracker",
  description:
    "Free JEE Main and JEE Advanced preparation tracker with chapter progress tracking, revision planning, readiness analysis, and performance insights.",
  images: ["/og-image.png"],
},

  keywords: [
    "JEE",
    "JEE Main",
    "JEE Advanced",
    "IIT",
    "Study Tracker",
    "JEE Tracker",
    "Exam Preparation",
    "JEE Progress Tracker",
  ],

  verification: {
    google: "BEa0x_Xu-H8XlbQlS_zT0hlXdrF9NMEKlnbC112qwWA",
  },
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
