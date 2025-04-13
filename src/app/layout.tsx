import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "M-CLAUD",
  description: "MultiCloud Log Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-10 overflow-y-auto">{children}</main>
      </body>
    </html>
  );
}
