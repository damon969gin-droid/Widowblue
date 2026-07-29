import "./globals.css";

export const metadata = {
  title: "Widow Blue",
  description: "Chat, rete mesh e ricompense in un'unica app.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
