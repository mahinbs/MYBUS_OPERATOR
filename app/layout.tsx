import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import { Providers } from "../components/Providers";
import { MYBUS_BOOTSTRAP_SCRIPT } from "../lib/mybusBootstrapScript";
import "./globals.css";

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pacifico',
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MY BUS Operator",
  description: "Premium bus fleet management platform",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true} className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} min-h-dvh w-full overflow-x-hidden bg-zinc-200 text-slate-900 antialiased`}
      >
        <script id="mybus-bootstrap" dangerouslySetInnerHTML={{ __html: MYBUS_BOOTSTRAP_SCRIPT }} />
        <div
          id="mybus-script-fail"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "none",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: 24,
            background: "linear-gradient(135deg,#1a0b2e,#7C3AED)",
            color: "#fff",
            textAlign: "center",
            fontFamily: "system-ui,sans-serif",
          }}
        >
          <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>MY BUS could not load</p>
          <p style={{ fontSize: 13, maxWidth: 320, lineHeight: 1.5, margin: 0, opacity: 0.9 }}>
            Scripts failed to load (common when opening a file from disk or wrong host path). Use{" "}
            <strong>npm run dev</strong> and open <strong>http://localhost:3000</strong>, or run{" "}
            <strong>npm run build</strong> then <strong>npm run serve:out</strong>.
          </p>
          <p style={{ fontSize: 12, margin: 0, opacity: 0.75 }}>
            Quick try:{" "}
            <a href="?demo=owner" style={{ color: "#fff", fontWeight: 600 }}>
              Owner demo
            </a>{" "}
            ·{" "}
            <a href="?demo=operator" style={{ color: "#fff", fontWeight: 600 }}>
              Operator demo
            </a>
          </p>
          <button
            id="mybus-dismiss-load-warning"
            type="button"
            style={{
              marginTop: 8,
              padding: "10px 20px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.35)",
              background: "rgba(255,255,255,0.12)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Dismiss (app may work below)
          </button>
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}