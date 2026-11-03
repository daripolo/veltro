import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";
import { ConvexClientProvider } from "@/src/components/provider/ConvexClientProvider";
import PwaRegister from "@/src/components/pwa/PwaRegister";
import InstallPrompt from "@/src/components/pwa/InstallPrompt";
import { getToken } from "@/src/lib/auth-server";
import { HeroUIProvider } from "@heroui/system";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "finance",
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    // Lets our own theme colour reach the iOS status bar.
    statusBarStyle: "default",
  },
  formatDetection: {
    // Banking numbers look like phone numbers to iOS otherwise.
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F0E8",
  width: "device-width",
  initialScale: 1,
  // Let content paint under the notch on iPhone, not just the home indicator.
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getToken();
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        <ConvexClientProvider initialToken={token}>
          <HeroUIProvider>
            <main>
              {children}
            </main>
            <InstallPrompt />
            <PwaRegister />
          </HeroUIProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
