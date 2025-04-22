"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

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

type FloatingBox = {
  label: string;
  frame: number;
  rows: number[];
};

const FLOATING_BOXES: FloatingBox[] = [
  { label: "Initial Access", frame: 194, rows: [] },
  { label: "Discovery", frame: 234, rows: [2, 3, 4, 6] },
  { label: "Lateral Movement", frame: 274, rows: [2, 7] },
  { label: "Collection", frame: 325, rows: [8] },
  { label: "Execution", frame: 373, rows: [5] },
];

function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const generateWaveData = () => {
  const rows: number[][] = [];
  const totalLength = 500;
  const baseSeed = 42;

  const waveSpec: Record<number, { start: number; end: number; amp: number }> = {
    0: { start: 254, end: 274, amp: 10 },
    1: { start: 294, end: 314, amp: 10 },
    3: { start: 334, end: 354, amp: 10 },
    6: { start: 334, end: 354, amp: 10 },
    4: { start: 334, end: 354, amp: 10 },
    2: { start: 374, end: 394, amp: 10 },
    7: { start: 374, end: 394, amp: 10 },
    8: { start: 414, end: 434, amp: 10 },
  };

  for (let row = 0; row < TACTICS.length; row++) {
    const wave: number[] = [];
    const { start, end, amp } = waveSpec[row] || { start: 0, end: 0, amp: 2 };

    for (let i = 0; i < totalLength; i++) {
      if (i >= start && i <= end) {
        const freq = 0.15 + seededRandom(baseSeed + row * 1000 + i) * 0.05;
        wave.push(Math.abs(Math.sin(i * freq + row) * amp));
      } else {
        wave.push(0);
      }
    }
    rows.push(wave);
  }

  return rows;
};

function isBoxVisible(frame: number, offset: number, svgLeft: number): boolean {
  if (typeof window === "undefined") return false;

  const frameX = LABEL_WIDTH + (frame - 5) * WAVE_SPACING;
  const centerX = frameX - offset + svgLeft + 340;
  return centerX >= 0 && centerX <= window.innerWidth;
}

export default function TimeSeriesGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const waveData = useRef(generateWaveData());
  const [offset, setOffset] = useState(0);
  const [highlightRows, setHighlightRows] = useState<number[]>([]);

  const getRowBgColor = (index: number) =>
    highlightRows.includes(index) ? "bg-green-300" : "bg-green-100";

  useEffect(() => {
    let lastTime = performance.now();
    const speed = 20;

    const animate = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setOffset((prev) => prev + dt * speed);
      requestAnimationFrame(animate);
    };

    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svgBounds = svgRef.current.getBoundingClientRect();

    let latestVisibleBox: FloatingBox | null = null;
  
    for (const box of FLOATING_BOXES) {
      if (isBoxVisible(box.frame, offset, svgBounds.left)) {
        if (!latestVisibleBox || box.frame > latestVisibleBox.frame) {
          latestVisibleBox = box;
        }
      }
    }

    if (latestVisibleBox) {
      setHighlightRows(latestVisibleBox.rows);
    } else {
      setHighlightRows([]);
    }
  }, [offset]);
  

  const getPath = (row: number): string => {
    const yCenter = row * ROW_HEIGHT + TOP_PADDING + 50;
    const points = waveData.current[row];
    const maxAmp = Math.max(...points.map((v) => Math.abs(v)));
    const shouldReduce = row === 2 || row === 3 || row === 4;
    const scale = (ROW_HEIGHT * (shouldReduce ? 0.2 : 0.5)) / (maxAmp || 1);

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
      <div className="absolute top-0 left-54 w-full h-full overflow-hidden pointer-events-none">
        {FLOATING_BOXES.map((box) => {
          const frameX = LABEL_WIDTH + (box.frame - 5) * WAVE_SPACING;
          const left = frameX - offset;
          const BOX_WIDTH = 120;

          const MAPPING_ROW: Record<string, number> = {
            "Initial Access": 0,
            "Discovery": 1,
            "Lateral Movement": 6,
            "Collection": 7,
            "Execution": 8,
          };

          const targetRow = MAPPING_ROW[box.label];
          const points = waveData.current[targetRow] || [];
          const pointIndex = Math.floor(box.frame);
          const amp = points[pointIndex] || 0;

          const centerY = targetRow * ROW_HEIGHT + TOP_PADDING + 50;
          const maxAmp = Math.max(...points.map((v) => Math.abs(v)));
          const shouldReduce = targetRow === 2 || targetRow === 4;
          const scale = (ROW_HEIGHT * (shouldReduce ? 0.2 : 0.5)) / (maxAmp || 1);

          const waveY = centerY - amp * scale;
          const isVisible = isBoxVisible(box.frame, offset, svgRef.current?.getBoundingClientRect().left || 0);

          return (
            <div key={box.label}>
              {/* 점: 위치 고정 아님, offset에 따라 계속 이동 */}
              {isVisible && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="absolute"
                  style={{
                    transform: `translateX(${left + BOX_WIDTH / 2 - 4}px)` ,
                    top: waveY - 18,
                    pointerEvents: "none",
                  }}
                >
                  <svg width={8} height={8}>
                    <circle cx={4} cy={4} r={4} fill="#f97316" />
                  </svg>
                </motion.div>
              )}
        
              {/* 선: 아래에서 위로 생성 */}
              {isVisible && (
                <motion.div
                  initial={{ height: 0, top: waveY, opacity: 0 }}
                  animate={{ height: waveY - 57, top: 40, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  className="absolute w-px bg-gray-400"
                  style={{
                    left: left + BOX_WIDTH / 2,
                  }}
                />
              )}
        
              {/* 박스: 가장 마지막 등장 */}
              {isVisible && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.6, duration: 0.3 }}
                  className="absolute px-2 py-1 bg-white text-xs border rounded shadow-sm font-semibold text-gray-800 whitespace-nowrap text-center"
                  style={{
                    top: 15,
                    left,
                    width: BOX_WIDTH,
                  }}
                >
                  {box.label}
                </motion.div>
              )}
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

        <foreignObject
          x={0}
          y={TOP_PADDING - ROW_HEIGHT}
          width={LABEL_WIDTH}
          height={ROW_HEIGHT}
        >
          <div className="bg-white h-full w-full border-b border-gray-300 flex items-center justify-center pt-1.5">
            <span className="text-base font-bold text-gray-800">
              Detected Tactics
            </span>
          </div>
        </foreignObject>

        <line
          x1={LABEL_WIDTH}
          y1={TOP_PADDING - ROW_HEIGHT}
          x2={LABEL_WIDTH}
          y2={TACTICS.length * ROW_HEIGHT + TOP_PADDING}
          stroke="#ccc"
          strokeWidth={2}
        />

        {TACTICS.map((label, i) => (          
          <g key={label}>
            <rect
              x={LABEL_WIDTH}
              y={i * ROW_HEIGHT + TOP_PADDING}
              width={3000}
              height={ROW_HEIGHT}
              fill={highlightRows.includes(i) ? "#FEF9C3" : "white"} // 파형 배경색
            />

            <foreignObject
              x={0}
              y={i * ROW_HEIGHT + TOP_PADDING}
              width={LABEL_WIDTH}
              height={ROW_HEIGHT}
            >
              <div
                className={`h-full w-full border-r border-gray-300 flex items-center justify-center ${getRowBgColor(i)}`}
              >
                <span className="text-sm font-semibold text-gray-700">
                  {label}
                </span>
              </div>
            </foreignObject>

            <line
              x1={0}
              y1={(i + 1) * ROW_HEIGHT + TOP_PADDING}
              x2={3000}
              y2={(i + 1) * ROW_HEIGHT + TOP_PADDING}
              stroke="#ccc"
              strokeWidth={1}
            />

            {i === 0 && (
              <line
                x1={0}
                y1={TOP_PADDING}
                x2={3000}
                y2={TOP_PADDING}
                stroke="#999"
                strokeWidth={1.5}
              />
            )}

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
