"use client";
import { useState } from "react";
import CloudLiveStatusCards from "./CloudLiveStatusCards";
import AttackGlobe, { AttackPoint } from "./AttackGlobe";
import Todo from "./Todo";
import CurrentTimeBox from "./CurrentTimeBox";
import RecentTTPs from "./RecentTTPs";
import MonthlyTTPChart from "./MonthlyTTPChart";

export default function Dashboard() {
  // 최신 TTP 10개 리스트
  const [latestTTPs, setLatestTTPs] = useState<AttackPoint[]>([]);
  // Globe에서 현재 선택된(포커스된) TTP (상태도 동기화)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentPoint, setCurrentPoint] = useState<AttackPoint | null>(null);
  // 6월 TTP별 합계 카운트 관리
  const [ttpCounts, setTtpCounts] = useState<{ [ttp: string]: number }>({});

  // AttackGlobe에서 새로운 TTP 탐지될 때 호출
  const handleDetect = (pt: AttackPoint) => {
    setLatestTTPs(prev =>
      [pt, ...prev.filter(x =>
        !(x.ip === pt.ip && x.ttp === pt.ttp && x.cloud === pt.cloud)
      )].slice(0, 10)
    );
    setCurrentPoint(pt);

    // 6월 TTP 카운트 누적
    setTtpCounts(prev => ({
      ...prev,
      [pt.ttp]: (prev[pt.ttp] || 0) + 1
    }));
  };

  // AttackGlobe에서 포커스가 바뀔 때도 현재 선택된 TTP 갱신(선택적)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFocusChange = (pt: AttackPoint) => {
    setCurrentPoint(pt);
  };

  // 6월 전체 합계
  const juneCount = Object.values(ttpCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="max-w-screen-2xl mx-auto px-0">
      {/* 헤더 막대 */}
      <div className="w-full h-12 bg-gradient-to-r bg-[#85a9c0] rounded-2xl shadow flex items-center px-8 mb-10">
        <span className="font-bold text-white text-xl tracking-wide">
          ATT-LAS Outline Dashboard
        </span>
      </div>
      {/* 상단 카드 */}
      <div className="flex mb-10 w-full ">
        <div className="flex" style={{ width: "60%" }}>
          <div className="flex-1 mr-6 shadow-md">
            <CloudLiveStatusCards cloudKeys={["aws-logs"]} />
          </div>
          <div className="flex-1 mr-6 shadow-md">
            <CloudLiveStatusCards cloudKeys={["azure-logs"]} />
          </div>
          <div className="flex-1 shadow-md">
            <CloudLiveStatusCards cloudKeys={["gcp-logs"]} />
          </div>
        </div>
        {/* 가운데 여백 */}
        <div style={{ width: "25px"}} />
        {/* 우측: 현재 시간 */}
        <div style={{ width: "40%" }}>
          <div className="bg-white rounded-2xl shadow-md w-full flex flex-col justify-center">
            <CurrentTimeBox />
          </div>
        </div>
      </div>
      {/* 본문 */}
      <div className="flex w-full">
        {/* 좌측 60%: 2개 박스 */}
        <div style={{ width: "60%" }} className="flex">
          <div className="flex-1 mr-6 flex flex-col">
            <div className="bg-white rounded-lg shadow-md p-3 flex-1 flex flex-col min-h-[400px]">
              <Todo />
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="bg-white rounded-lg pt-5 shadow-md flex-1 flex flex-col items-center justify-start h-[300px]">
              {/* AttackGlobe에 onDetect props로 최신TTP 전달 */}
              <AttackGlobe
                width={360}
                height={360}
                onDetect={handleDetect}
                //onFocusChange={handleFocusChange}
              />
              <div className="mt-8 text-center w-full"></div>
            </div>
          </div>
        </div>
        {/* 가운데 여백 */}
        <div style={{ width: "25px"}} />
        {/* 우측 40%: 박스 3개 */}
        <div
          style={{
            width: "40%",
            display: "flex",
            flexDirection: "column",
            gap: "32px",
            height: "100%",
          }}
        >
          {/* 1. 최근 TTP */}
          <div style={{ width: "100%" }}>
            <div className="bg-white rounded-lg shadow-md p-4 w-full min-h-[120px] flex flex-col justify-center">
              <RecentTTPs latestTTPs={latestTTPs} />
            </div>
          </div>
          {/* 2. 월별 TTP */}
          <div style={{ width: "100%" }}>
            <div className="bg-white rounded-lg shadow-md p-4 w-full min-h-[120px] flex flex-col justify-center">
              <MonthlyTTPChart juneCount={juneCount} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

