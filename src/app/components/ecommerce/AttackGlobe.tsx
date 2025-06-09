"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { GlobeMethods } from "react-globe.gl"; // Globe ref 타입 명시

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

function randomIp(): string {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 254) + 1).join(".");
}

const ttpLabels: string[] = [
  "T1046: Port Scan",
  "T1110: Credential Access",
  "T1566: Phishing",
  "T1190: Exploit Public-Facing App",
  "T1059: Command & Scripting",
  "T1087: Account Discovery",
  "T1021: Remote Services",
  "T1106: Native API",
  "T1078: Valid Accounts",
  "T1486: Data Encrypted for Impact"
];

interface AttackPoint {
  lat: number;
  lng: number;
  label: string;
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

export default function AttackGlobe({
  width = 400,
  height = 400
}: {
  width?: number;
  height?: number;
}) {
  const [attackPoints, setAttackPoints] = useState<AttackPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  // ref의 타입과 초기값을 GlobeMethods | undefined, undefined로!
  const globeRef = useRef<GlobeMethods | undefined>(undefined);

  useEffect(() => {
    async function addRandomTTP() {
      setLoading(true);
      const ttpLabel = ttpLabels[Math.floor(Math.random() * ttpLabels.length)];
      const ip = randomIp();
      const geo = await ipToLatLng(ip);
      setLoading(false);

      if (geo) {
        const newPoint = { lat: geo.lat, lng: geo.lng, label: `${ttpLabel} (${ip})` };
        setAttackPoints(prev => {
          const updated = [newPoint, ...prev].slice(0, 10);
          setTimeout(() => focusGlobeSmooth(newPoint), 600);
          setCurrentIdx(0);
          return updated;
        });
      }
    }
    addRandomTTP();
  }, []);

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
      <div style={{
        position: "absolute",
        top: 12,
        right: 20,
        display: "flex",
        gap: 8,
        zIndex: 2
      }}>
        <button
          className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-400 text-lg font-bold"
          onClick={handlePrev}
          title="이전 TTP"
        >◀</button>
        <button
          className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-400 text-lg font-bold"
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
        pointColor={() => "red"}
        pointAltitude={0.02}
        pointLabel="label"
        pointRadius={0.4}
        width={width}
        height={height}
        backgroundColor="black"
        showAtmosphere={true}
      />
      <div className="mt-10 text-sm text-gray-500 w-full text-left px-2">
        {loading && "위협 데이터 로딩 중..."}
        {!loading && attackPoints.length > 0 && (
          <ul>
            {attackPoints.map((pt, idx) => (
              <li key={idx} className={idx === currentIdx ? "font-bold text-blue-700" : ""}>
                {idx === currentIdx ? "▶ " : ""}
                {pt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
