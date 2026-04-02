import type { Metadata } from "next";
import { ADSENSE_CLIENT } from "@/lib/adsense";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const description = "Live global severity index backed by real-world events, risk signals, and current news.";
const siteUrl = getSiteUrl();
const socialImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Are we Fcked? share card with a risk dial and question mark"
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "Are we Fcked?",
  title: {
    default: "Are we Fcked?",
    template: "%s | Are we Fcked?"
  },
  description,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Are we Fcked?",
    title: "Are we Fcked?",
    description,
    images: [socialImage]
  },
  twitter: {
    card: "summary_large_image",
    title: "Are we Fcked?",
    description,
    images: [socialImage]
  },
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout(props: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-background text-foreground antialiased">
        <div className="min-h-screen">
          <main className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-4 pb-16 pt-0 sm:px-6 lg:px-8">{props.children}</main>
        </div>
      </body>
    </html>
  );
}
