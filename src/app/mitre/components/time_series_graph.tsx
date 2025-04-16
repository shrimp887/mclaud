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

const ROW_HEIGHT = 60;
const LABEL_WIDTH = 200;
const WAVE_SPACING = 4;
const TOP_PADDING = 40;

// 추가: 파동별 floating box 표시용 정보
const FLOATING_BOXES = [
  { label: "Initial Access", frame: 171 },
  { label: "Discovery", frame: 211 },
  { label: "Lateral Movement", frame: 251 },
  { label: "Collection", frame: 291 },
  { label: "Execution", frame: 331 },
];

/* 파형 생성 부분 */
const generateWaveData = () => {
  const rows: number[][] = [];
  const totalLength = 500;

  // tactic index 기준: row 번호 - 파동 생성
  const waveSpec: Record<number, { start: number; end: number; amp: number }> = {
    0: { start: 224, end: 244, amp: 10 },   // Initial Access
    1: { start: 264, end: 284, amp: 10 },   // Execution
    6: { start: 304, end: 324, amp: 10 },   // Discovery (가장 처음 인식)
    2: { start: 314, end: 324, amp: 10 },   // Persistence
    4: { start: 314, end: 324, amp: 10 },   // Defense Evasion
    7: { start: 344, end: 364, amp: 10 },   // Lateral Movement
    8: { start: 384, end: 404, amp: 10 },   // Collection
  };
  
  
  

  for (let row = 0; row < TACTICS.length; row++) {
    const wave: number[] = [];
    const { start, end, amp } = waveSpec[row] || { start: 0, end: 0, amp: 2 }; // 비감지 row는 약하게 유지

    for (let i = 0; i < totalLength; i++) {
      if (i >= start && i <= end) {
        const freq = 0.15 + Math.random() * 0.05;
        wave.push(Math.abs(Math.sin(i * freq + row) * amp));
      } else {
        wave.push(0);
      }
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
    const yCenter = row * ROW_HEIGHT + TOP_PADDING + 50;
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
    <div className="relative bg-white border rounded shadow overflow-hidden border-gray-300 rounded-xl shadow-md p-4">
      {/* Floating Boxes + TimeLine */}
      <div className="absolute top-0 left-54 w-full h-full overflow-hidden pointer-events-none">
        {FLOATING_BOXES.map((box) => {
          const frameX = LABEL_WIDTH + (box.frame - 5) * WAVE_SPACING;
          const left = frameX - offset;
          return (
            <div key={box.label}>
              {/* 박스 */}
              <div
                className="absolute px-2 py-1 bg-white text-xs border rounded shadow-sm font-semibold text-gray-800 whitespace-nowrap"
                style={{ top: 4, left:left+31}}
              >
                {box.label}
              </div>

              {/* 세로선 */}
              <div
                className="absolute w-px bg-gray-400"
                style={{
                  left: left + 32,
                  top: 32,
                  height: TACTICS.length * ROW_HEIGHT,
                }}
              />
            </div>
          );
        })}
      </div>


      <svg
        ref={svgRef}
        width={3000}
        height={TACTICS.length * ROW_HEIGHT + TOP_PADDING}
        style={{ background: "white" }}
      >
        {/* 그래프 클리핑 영역 */}
        <defs>
          <clipPath id="graph-area">
            <rect
              x={LABEL_WIDTH}
              y={TOP_PADDING}
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
              y={i * ROW_HEIGHT + TOP_PADDING}
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
              y1={(i + 1) * ROW_HEIGHT + TOP_PADDING}
              x2={3000}
              y2={(i + 1) * ROW_HEIGHT + TOP_PADDING}
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
