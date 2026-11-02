import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ConvexClientProvider } from "@/src/components/provider/ConvexClientProvider";
import PwaRegister from "@/src/components/pwa/PwaRegister";
import InstallPrompt from "@/src/components/pwa/InstallPrompt";
import { getToken } from "@/src/lib/auth-server";
import { HeroUIProvider } from "@heroui/system";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

const APP_NAME = "Veltro";
const APP_DESCRIPTION =
  "Banking, transfers and investments — your money, protected and in one place.";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
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
