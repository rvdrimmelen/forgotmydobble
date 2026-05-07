import "./globals.css";

export const metadata = {
  title: "Dobbel",
  description: "Dobbelstenen en scorekaart voor onderweg",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1c1917",
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Dobbel" />
      </head>
      <body>{children}</body>
    </html>
  );
}
