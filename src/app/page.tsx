"use client";
import CloudLiveStatusCards from "./components/ecommerce/CloudLiveStatusCards";
import RecentTTPs from "./components/ecommerce/RecentTTPs";
import MonthlyTTPChart from "./components/ecommerce/MonthlyTTPChart";

export default function Dashboard() {
  return (
    <div className="p-8 space-y-6 max-w-screen-xl mx-auto">
      {/* 상단: 클라우드 상태 + 최근 TTP */}
      <div className="grid grid-cols-6 gap-4">
        {/* 클라우드 상태 카드들 */}
        <div className="col-span-1">
          <CloudLiveStatusCards cloudKeys={["aws-logs"]} />
        </div>
        <div className="col-span-1">
          <CloudLiveStatusCards cloudKeys={["azure-logs"]} />
        </div>
        <div className="col-span-1">
          <CloudLiveStatusCards cloudKeys={["gcp-logs"]} />
        </div>

        {/* 최근 TTP - 폭 좁게 조절 */}
        <div className="col-span-2">
          <RecentTTPs />
        </div>
      </div>

      {/* 하단: 월별 TTP */}
      <div className="pt-6">
        <MonthlyTTPChart />
      </div>
    </div>
  );
}

