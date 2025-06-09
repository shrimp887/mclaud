"use client";
import CloudLiveStatusCards from "./components/ecommerce/CloudLiveStatusCards";
import RecentTTPs from "./components/ecommerce/RecentTTPs";
import MonthlyTTPChart from "./components/ecommerce/MonthlyTTPChart";
import AttackGlobe from "./components/ecommerce/AttackGlobe";

export default function Dashboard() {
  return (
    <div className="px-10 py-8 max-w-screen-2xl mx-auto">
      {/* 전체 5열 그리드로 좌우 분할 */}
      <div className="grid grid-cols-5 gap-6">
        {/* 왼쪽 영역: 클라우드 상태 + AttackGlobe */}
        <div className="col-span-2 space-y-6">
          {/* 클라우드 상태 카드 3개 */}
          <div className="grid grid-cols-3 gap-4">
            <CloudLiveStatusCards cloudKeys={["aws-logs"]} />
            <CloudLiveStatusCards cloudKeys={["azure-logs"]} />
            <CloudLiveStatusCards cloudKeys={["gcp-logs"]} />
          </div>
          {/* 지구본 시각화 */}
          <div className="bg-white rounded-2xl shadow-xl p-4">
            <AttackGlobe width={320} height={320} />
          </div>
        </div>

        {/* 오른쪽 영역: 최근 TTP + 월별 차트 */}
        <div className="col-span-3 space-y-6">
          <RecentTTPs />
          <MonthlyTTPChart />
        </div>
      </div>
    </div>
  );
}

