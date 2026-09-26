import { ClerkProvider } from "@clerk/nextjs";
import "@/app/globals.css";
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/providers/auth-provider";
import { AuthGuard } from "@/components/auth/auth-guard";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "SecureView AI - CCTV Monitoring",
  description: "Advanced CCTV monitoring with AI-powered analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                window.next = window.next || {};
                window.next.version = "15.0.0";
                window.__internal_onBeforeSetActive = function() { return Promise.resolve(); };
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ClerkProvider>
          <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          >
          <AuthProvider>
          <AuthGuard>
          {children}
          </AuthGuard>
          <Toaster />
          </AuthProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}