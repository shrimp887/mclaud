import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "ATT-LAS",
  description: "MultiCloud Log Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen text-[#4b3621] relative">
        {/* 배경 이미지 레이어 */}
        <div className="absolute inset-0 z-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: "url('/images/world-map-old-paper.png')" }}
        ></div>

        {/* 실제 콘텐츠 레이어 */}
        <div className="flex flex-1 relative z-10">
          <Sidebar />
          <main className="flex-1 p-10 overflow-y-auto bg-transparent">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

