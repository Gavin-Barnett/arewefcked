import type { Metadata } from "next";
import "./globals.css";

const description = "Live global severity index backed by real-world events, risk signals, and current news.";

export const metadata: Metadata = {
  metadataBase: new URL("https://arewefcked.com"),
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
    images: [{ url: "/opengraph-image" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Are we Fcked?",
    description,
    images: ["/opengraph-image"]
  },
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout(props: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased">
        <div className="min-h-screen">
          <main className="mx-auto flex min-h-screen max-w-[1500px] flex-col px-4 pb-16 pt-0 sm:px-6 lg:px-8">{props.children}</main>
        </div>
      </body>
    </html>
  );
}
