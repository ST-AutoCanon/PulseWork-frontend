import "./globals.css";
import { AuthProvider } from "../src/context/AuthProvider.client";
import AuthLoadingOverlay from "../src/components/AuthLoadingOverlay/AuthLoadingOverlay.client";

export const metadata = {
  title: "PulseWork",
  description: "NextJS start",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body>
        <AuthProvider>
          <div id="portal-root" />
          <AuthLoadingOverlay />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
