"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { GlobeMethods } from "react-globe.gl";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const clouds = [
  { key: "aws", label: "AWS" },
  { key: "azure", label: "Azure" },
  { key: "gcp", label: "GCP" }
];

const ttpLabels: string[] = [
  "T1059: Command & Scripting Interpreter",
  "T1078.001: Valid Accounts - Default Accounts",
  "T1003: OS Credential Dumping",
  "T1110: Brute Force",
  "T1566.002: Spearphishing Link",
  "T1021.004: Remote Services - SMB/Windows Admin Shares",
  "T1203: Exploitation for Client Execution",
  "T1047: Windows Management Instrumentation",
  "T1087.001: Account Discovery - Local Account",
  "T1053: Scheduled Task/Job"
];

export interface AttackPoint {
  lat: number;
  lng: number;
  label: string;
  ip: string;
  ttp: string;
  count: number;
  cloud: string;
  cloudKey: string;
  detectedAt: string;
}

function randomIp(): string {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 254) + 1).join(".");
}

async function ipToLatLng(ip: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await res.json();
    if (data.status === "success") {
      return { lat: data.lat, lng: data.lon };
    }
    return null;
  } catch {
    return null;
  }
}

const fixedCombo = { ip: "8.8.8.8", ttp: ttpLabels[0], cloud: clouds[0] };

export default function AttackGlobe({
  width = 400,
  height = 400,
  onDetect
}: {
  width?: number;
  height?: number;
  onDetect?: (pt: AttackPoint) => void;
}) {
  const [attackPoints, setAttackPoints] = useState<AttackPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const callCount = useRef<number>(0);
  const [running, setRunning] = useState<boolean>(false);

  useEffect(() => {
    setAttackPoints([]);
    setCurrentIdx(0);
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (running) {
      const id = setInterval(() => {
        addRandomTTP();
      }, 5000);
      setIntervalId(id);
      return () => clearInterval(id);
    } else if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }, [running]);

  async function addRandomTTP() {
    setLoading(true);

    let ttpLabel: string;
    let ip: string;
    let cloud = clouds[Math.floor(Math.random() * clouds.length)];

    // 1,3,5번째는 고정
    if ([0, 2, 4].includes(callCount.current % 10)) {
      ttpLabel = fixedCombo.ttp;
      ip = fixedCombo.ip;
      cloud = fixedCombo.cloud;
    } else {
      ttpLabel = ttpLabels[Math.floor(Math.random() * ttpLabels.length)];
      ip = randomIp();
      cloud = clouds[Math.floor(Math.random() * clouds.length)];
    }
    callCount.current++;

    const geo = await ipToLatLng(ip);
    setLoading(false);

    if (geo) {
      setAttackPoints(prev => {
        const idx = prev.findIndex(
          p => p.ip === ip && p.ttp === ttpLabel && p.cloud === cloud.label
        );
        let updated: AttackPoint[];
        if (idx !== -1) {
          updated = prev.map((p, i) =>
            i === idx
              ? { ...p, count: p.count + 1 }
              : p
          );
          setTimeout(() => focusGlobeSmooth(updated[idx]), 600);
          setCurrentIdx(idx);
        } else {
          const now = new Date();
          const newPoint: AttackPoint = {
            lat: geo.lat,
            lng: geo.lng,
            label: `${ttpLabel} (${ip})`,
            ip,
            ttp: ttpLabel,
            count: 1,
            cloud: cloud.label,
            cloudKey: cloud.key,
            detectedAt: now.toLocaleString("ko-KR", { hour12: false })
          };
          updated = [newPoint, ...prev].slice(0, 20);
          setTimeout(() => focusGlobeSmooth(newPoint), 600);
          setCurrentIdx(0);

          // 최신 TTP 알림용 콜백
          if (onDetect){
            console.log("onDetect 실행!", newPoint);  // ← 추가!
            setTimeout(() => onDetect(newPoint), 0);
          }
        }
        return updated;
      });
    }
  }

  function focusGlobeSmooth(pt: AttackPoint | undefined) {
    if (!pt || !globeRef.current) return;
    const curr = globeRef.current.pointOfView();
    const rotateTo = {
      lat: curr.lat,
      lng: curr.lng + 360,
      altitude: curr.altitude
    };
    globeRef.current.pointOfView(rotateTo, 1200);
    setTimeout(() => {
      globeRef.current?.pointOfView({ lat: pt.lat, lng: pt.lng, altitude: 1.2 }, 1200);
    }, 1200);
  }

  function handlePrev() {
    if (attackPoints.length === 0) return;
    const nextIdx = (currentIdx + 1) % attackPoints.length;
    setCurrentIdx(nextIdx);
    focusGlobeSmooth(attackPoints[nextIdx]);
  }
  function handleNext() {
    if (attackPoints.length === 0) return;
    const nextIdx = (currentIdx - 1 + attackPoints.length) % attackPoints.length;
    setCurrentIdx(nextIdx);
    focusGlobeSmooth(attackPoints[nextIdx]);
  }

  function getPointColor(obj: object): string {
    const pt = obj as AttackPoint;
    const maxStep = 10;
    const step = Math.min(pt.count, maxStep);
    const lightness = 65 - ((65 - 1) / (maxStep - 1)) * (step - 1);
    return `hsl(0, 100%, ${lightness}%)`;
  }
  function getPointRadius(obj: object): number {
    const pt = obj as AttackPoint;
    return 0.4 + 0.25 * (pt.count - 1);
  }

  return (
    <div
      style={{
        width: width + "px",
        minWidth: width + "px",
        height: height + 120 + "px",
        minHeight: height + 120 + "px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative"
      }}
    >
      {/* 좌상단: 시작/정지 버튼 */}
      <div style={{
        position: "absolute",
        top: 12,
        left: 16,
        zIndex: 2
      }}>
        <button
          className="px-3 py-1 rounded bg-[#a7cce6] hover:bg-blue-300 text-base font-semibold"
          onClick={() => setRunning(r => !r)}
        >
          {running ? "정지" : "시작"}
        </button>
      </div>
      {/* 우상단: 화살표 */}
      <div style={{
        position: "absolute",
        top: 12,
        right: 20,
        display: "flex",
        gap: 8,
        zIndex: 2
      }}>
        <button
          className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-400 text-lg font-bold"
          onClick={handlePrev}
          title="이전 TTP"
        >◀</button>
        <button
          className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-400 text-lg font-bold"
          onClick={handleNext}
          title="다음 TTP"
        >▶</button>
      </div>
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        pointsData={attackPoints}
        pointLat="lat"
        pointLng="lng"
        pointColor={getPointColor}
        pointAltitude={0.02}
        pointLabel="label"
        pointRadius={getPointRadius}
        width={width}
        height={height}
        backgroundColor="black"
        showAtmosphere={true}
      />
      {/* 아래: 탐지 TTP 정보 (포커스된 하나만, 한 줄 한 정보) */}
      <div className="mt-4 text-sm text-gray-700 w-full text-left px-2">
        {loading && "위협 데이터 로딩 중..."}
        {!loading && attackPoints.length > 0 && (
          (() => {
            const pt = attackPoints[currentIdx];
            const cloudLogo: Record<string, string> = {
              AWS: "/images/aws-icon.png",
              Azure: "/images/azure-icon.png",
              GCP: "/images/gcp-icon.png",
            };
            // 클라우드 로고 key 변환
            let logoKey = "AWS";
            if (pt.cloud.toLowerCase().includes("azure")) logoKey = "Azure";
            else if (pt.cloud.toLowerCase().includes("gcp")) logoKey = "GCP";
            return pt ? (
              <div className="rounded bg-gray-50 px-4 py-3 shadow flex flex-col gap-2 items-start">
                {/* 맨 위: 클라우드 로고 */}
                <div className="mb-1 flex items-center">
                  <img
                    src={cloudLogo[logoKey]}
                    alt={pt.cloud}
                    className="w-8 h-8 mr-2 inline-block"
                  />
                  <span className="text-base font-semibold">{pt.cloud}</span>
                </div>
                {/* 한 줄에 하나씩 */}
                <div>
                  <span className="font-bold text-blue-700">TTP</span>
                  <span className="ml-2">{pt.ttp}</span>
                </div>
                <div>
                  <span className="font-bold text-blue-700">IP</span>
                  <span className="ml-2">{pt.ip}</span>
                </div>
                <div>
                  <span className="font-bold text-blue-700">Time</span>
                  <span className="ml-2">{pt.detectedAt}</span>
                </div>
                {pt.count > 1 && (
                  <div>
                    <span className="font-bold text-blue-700">count</span>
                    <span className="ml-2 text-red-500">{pt.count}</span>
                  </div>
                )}
              </div>
            ) : null;
          })()
        )}
      </div>



    </div>
  );
}

