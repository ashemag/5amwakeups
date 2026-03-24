import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { XAuthProvider } from "@/components/x-auth-provider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = "https://5amwakeups.vercel.app";
const title = "The 5AM Club — Social Leaderboard for Verified Early Risers";
const description =
  "A social leaderboard for the 5AM wake-up club. Connect your Oura ring, verify your wake time, and compete with friends. Open source.";

export const metadata: Metadata = {
  title: {
    default: title,
    template: "%s | The 5AM Club",
  },
  description,
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "The 5AM Club",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    creator: "@ashebytes",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

/**
 * Inline script that runs before React hydrates to prevent a flash of
 * wrong theme. Reads localStorage and system preference, then sets the
 * `dark` class on <html> synchronously.
 */
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    var d = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (d) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh font-sans">
        <ThemeProvider>
          <XAuthProvider>{children}</XAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
