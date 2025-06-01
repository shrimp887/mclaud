"use client";
import React, { useEffect, useState, useRef } from "react";

// 로그 데이터 타입 정의
type Bucket = { doc_count: number; key_as_string: string };
type LogBucket = { index: string; buckets: Bucket[] };

const CLOUDS = ["aws-logs", "azure-logs", "gcp-logs"];
const LABELS = ["AWS", "Azure", "GCP"];
const ROW_HEIGHT = 60;
const LABEL_WIDTH = 120;
const TOP_PADDING = 40;
const INTERVAL_MS = 30 * 1000; // 30초마다 새로고침

export default function CloudLogVolumeGraph() {
  const [logData, setLogData] = useState<number[][]>([[], [], []]);
  const [labels, setLabels] = useState<string[]>([]);
  const [offset, setOffset] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  // 1. 데이터 fetch
  useEffect(() => {
    const fetchData = async () => {
      const end = new Date();
      const start = new Date(end.getTime() - 10 * 60 * 1000); // 최근 10분
      const params = `start=${start.toISOString()}&end=${end.toISOString()}`;
      const res = await fetch(`/api/logs?${params}`);
      const json: LogBucket[] = await res.json();

      const cloudData: number[][] = [];
      let xLabels: string[] = [];
      let maxLen = 0;
      for (let i = 0; i < CLOUDS.length; i++) {
        const buckets = json.find((x) => x.index === CLOUDS[i])?.buckets ?? [];
        const arr = buckets.map((b) => b.doc_count);
        cloudData.push(arr);
        if (arr.length > maxLen) maxLen = arr.length;
        if (buckets.length > 0 && xLabels.length === 0) {
          xLabels = buckets.map((b) => b.key_as_string.slice(11));
        }
      }
      const paddedCloudData = cloudData.map(arr =>
        arr.length < xLabels.length
          ? [...arr, ...Array(xLabels.length - arr.length).fill(0)]
          : arr
      );
      setLogData(paddedCloudData);
      setLabels(xLabels);
    };

    fetchData();
    const timer = setInterval(fetchData, INTERVAL_MS); // let → const

    return () => clearInterval(timer);
  }, []);

  // 2. 슬라이딩 효과 (원하면 유지)
  useEffect(() => {
    let lastTime = performance.now();
    const speed = 10;
    let anim: number;

    const animate = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setOffset((prev) => prev + dt * speed);
      anim = requestAnimationFrame(animate);
    };
    anim = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(anim);
  }, []);

  // 화면 너비에 따라 동적으로 x간격을 계산
  const getX = (i: number, totalPoints: number, width: number) => {
    const graphWidth = width - LABEL_WIDTH - 20;
    return LABEL_WIDTH + (i / (totalPoints - 1)) * graphWidth - offset;
  };

  // 그래프 path 생성
  const GRAPH_TOP_PADDING = 12;
  const GRAPH_BOTTOM_PADDING = 12;

  const getPath = (row: number, width: number) => {
    const points = logData[row] ?? [];
    if (!points.length) return "";

    const yBoxTop = row * ROW_HEIGHT + TOP_PADDING + GRAPH_TOP_PADDING;
    const yBoxHeight = ROW_HEIGHT - GRAPH_TOP_PADDING - GRAPH_BOTTOM_PADDING;

    const maxVal = Math.max(...points, 1);
    const minVal = Math.min(...points, 0);
    const scale = yBoxHeight / (maxVal - minVal || 1);

    let d = "";
    for (let i = 0; i < points.length; i++) {
      const x = getX(i, points.length, width);
      const y = yBoxTop + (maxVal - points[i]) * scale;
      d += i === 0 ? `M ${x},${y}` : ` L ${x},${y}`;
    }
    return d;
  };

  // 반응형 SVG width 계산
  const [svgWidth, setSvgWidth] = useState(800);
  useEffect(() => {
    function handleResize() {
      if (svgRef.current) {
        setSvgWidth(svgRef.current.clientWidth);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 실제 렌더
  const svgHeight = CLOUDS.length * ROW_HEIGHT + TOP_PADDING + 40;

  return (
    <div className="relative bg-white border rounded shadow p-4 w-full overflow-x-hidden">
      <svg
        ref={svgRef}
        width="100%"
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ background: "white", display: "block" }}
      >
        <defs>
          <clipPath id="graph-area">
            <rect
              x={LABEL_WIDTH}
              y={TOP_PADDING}
              width={svgWidth - LABEL_WIDTH - 20}
              height={CLOUDS.length * ROW_HEIGHT}
            />
          </clipPath>
        </defs>

        {/* Y축 라벨 */}
        <foreignObject
          x={0}
          y={TOP_PADDING - ROW_HEIGHT}
          width={LABEL_WIDTH}
          height={ROW_HEIGHT}
        >
          <div className="bg-white h-full w-full flex items-center justify-center pt-1.5">
            <span className="text-base font-bold text-gray-800">
              Cloud Platform
            </span>
          </div>
        </foreignObject>

        {/* 세로 기준선 */}
        <line
          x1={LABEL_WIDTH}
          y1={TOP_PADDING - ROW_HEIGHT}
          x2={LABEL_WIDTH}
          y2={CLOUDS.length * ROW_HEIGHT + TOP_PADDING}
          stroke="#ccc"
          strokeWidth={2}
        />

        {CLOUDS.map((label, i) => (
          <g key={label}>
            <rect
              x={LABEL_WIDTH}
              y={i * ROW_HEIGHT + TOP_PADDING}
              width={svgWidth - LABEL_WIDTH - 20}
              height={ROW_HEIGHT}
              fill="#f3f4f6"
            />

            {/* 플랫폼 이름 */}
            <foreignObject
              x={0}
              y={i * ROW_HEIGHT + TOP_PADDING}
              width={LABEL_WIDTH}
              height={ROW_HEIGHT}
            >
              <div className="h-full w-full border-r border-gray-300 flex items-center justify-center bg-white">
                <span className="text-sm font-semibold text-gray-700">
                  {LABELS[i]}
                </span>
              </div>
            </foreignObject>

            {/* 가로 구분선 */}
            <line
              x1={0}
              y1={(i + 1) * ROW_HEIGHT + TOP_PADDING}
              x2={svgWidth}
              y2={(i + 1) * ROW_HEIGHT + TOP_PADDING}
              stroke="#ccc"
              strokeWidth={1}
            />

            {/* 웨이브(로그 수집량) */}
            <g clipPath="url(#graph-area)">
              <path
                d={getPath(i, svgWidth)}
                stroke={["#6366f1", "#10b981", "#f59e42"][i]}
                fill="none"
                strokeWidth={2}
              />
            </g>
          </g>
        ))}

        {labels.length > 0 && (
          <g>
            {labels.map((time, i) => {
              const interval = Math.ceil(labels.length / 7); // 7개 정도만 보이게
              if (i % interval !== 0) return null;
              const x = getX(i, labels.length, svgWidth);
              if (x < LABEL_WIDTH || x > svgWidth - 20) return null;
              return (
                <text
                  key={time + i}
                  x={x}
                  y={TOP_PADDING + CLOUDS.length * ROW_HEIGHT + 18}
                  fontSize="11"
                  fill="#777"
                  textAnchor="middle"
                >
                  {time}
                </text>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}
