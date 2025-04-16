"use client";

import React, { useEffect, useRef, useState } from "react";

const TACTICS = [
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Defense Evasion",
  "Credential Access",
  "Discovery",
  "Lateral Movement",
  "Collection",
  "Exfiltration",
  "Impact",
];

const ROW_HEIGHT = 80;
const LABEL_WIDTH = 200;

/* 파형 생성 부분 */
const generateWaveData = () => {
  const rows: number[][] = [];

  for (let row = 0; row < TACTICS.length; row++) {
    const wave: number[] = [];
    for (let i = 0; i < 300; i++) {
      const amp = 10 + Math.random() * 10;
      const freq = 0.1 + Math.random() * 0.1;
      wave.push(Math.sin(i * freq + row) * amp);
    }
    rows.push(wave);
  }

  return rows;
};

export default function TimeSeriesGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const waveData = useRef(generateWaveData());
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let lastTime = performance.now();
    const speed = 5;

    const animate = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setOffset((prev) => prev + dt * speed);
      requestAnimationFrame(animate);
    };

    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, []);

  const getPath = (row: number): string => {
    const yCenter = row * ROW_HEIGHT + ROW_HEIGHT / 2;
    const points = waveData.current[row];
    const maxAmp = Math.max(...points.map((v) => Math.abs(v)));
    const scale = (ROW_HEIGHT * 0.5) / (maxAmp || 1);

    let d = "";
    for (let i = 0; i < points.length; i++) {
      const x = LABEL_WIDTH + i * 4 - offset;
      const y = yCenter - points[i] * scale;
      d += i === 0 ? `M ${x},${y}` : ` L ${x},${y}`;
    }
    return d;
  };

  return (
    <div className="relative bg-white border rounded shadow overflow-hidden">
      <svg
        ref={svgRef}
        width={3000}
        height={TACTICS.length * ROW_HEIGHT}
        style={{ background: "white" }}
      >
        {/* 그래프 클리핑 영역 */}
        <defs>
          <clipPath id="graph-area">
            <rect
              x={LABEL_WIDTH}
              y={0}
              width={3000}
              height={TACTICS.length * ROW_HEIGHT}
            />
          </clipPath>
        </defs>

        {TACTICS.map((label, i) => (
          <g key={label}>
            {/* 좌측 라벨 영역 */}
            <foreignObject
              x={0}
              y={i * ROW_HEIGHT}
              width={LABEL_WIDTH}
              height={ROW_HEIGHT}
            >
              <div className="bg-green-100 h-full w-full border-r border-gray-300 flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-700">
                  {label}
                </span>
              </div>
            </foreignObject>

            {/* 구분선 (행 아래쪽에 그려짐) */}
            <line
              x1={0}
              y1={(i + 1) * ROW_HEIGHT}
              x2={3000}
              y2={(i + 1) * ROW_HEIGHT}
              stroke="#ccc"
              strokeWidth={1}
            />

            {/* 그래프 라인 (클립 적용) */}
            <g clipPath="url(#graph-area)">
              <path
                d={getPath(i)}
                stroke="#f97316"
                fill="none"
                strokeWidth={1.5}
              />
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
