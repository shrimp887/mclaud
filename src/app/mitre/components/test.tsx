"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface LogBucket {
  key_as_string: string;
  doc_count: number;
}

interface SeriesData {
  timestamp: string;
  aws?: number;
  azure?: number;
  gcp?: number;
}

interface ApiResponseEntry {
  index: string;
  buckets: LogBucket[];
}

const cloudColors: Record<string, string> = {
  aws: "#1f77b4",
  azure: "#2ca02c",
  gcp: "#ff7f0e",
};

function toISOStringLocal(dt: Date) {
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export default function TestChart() {
  const [data, setData] = useState<SeriesData[]>([]);
  const [start, setStart] = useState(
    () => toISOStringLocal(new Date(Date.now() - 3600000)) // 기본 1시간 전
  );
  const [end, setEnd] = useState(""); // 비우면 현재 시간
  const [selectedClouds, setSelectedClouds] = useState<string[]>([
    "aws",
    "azure",
    "gcp",
  ]);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append("start", new Date(start).toISOString());
      if (end) {
        params.append("end", new Date(end).toISOString());
      }

      const res = await fetch(`/api/logs?${params.toString()}`);
      const raw: ApiResponseEntry[] = await res.json();

      const combined: { [key: string]: SeriesData } = {};

      raw.forEach((entry: ApiResponseEntry) => {
        const source = entry.index.replace("-logs", "");
        if (!selectedClouds.includes(source)) return;

        entry.buckets.forEach((b: LogBucket) => {
          if (!combined[b.key_as_string]) {
            combined[b.key_as_string] = { timestamp: b.key_as_string };
          }

          const key = source as keyof Omit<SeriesData, "timestamp">;
          combined[b.key_as_string][key] = b.doc_count;
        });
      });

      const sorted = Object.values(combined).sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      setData(sorted);
    } catch (e) {
      console.error("데이터 불러오기 실패:", e);
    }
  }, [start, end, selectedClouds]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleCloud = (cloud: string) => {
    setSelectedClouds((prev) =>
      prev.includes(cloud) ? prev.filter((c) => c !== cloud) : [...prev, cloud]
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="text-lg font-bold mb-4">클라우드 로그 시계열 그래프</h3>

      {/* 시간 선택 */}
      <div className="flex gap-4 mb-4 items-center">
        <label className="text-sm font-medium">시작 시간:</label>
        <input
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="px-2 py-1 border rounded text-sm"
        />

        <label className="text-sm font-medium">끝 시간:</label>
        <input
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="px-2 py-1 border rounded text-sm"
        />
        <span className="text-xs text-gray-500">(비우면 현재 시간)</span>
      </div>

      {/* 클라우드 필터 */}
      <div className="flex gap-4 mb-4">
        {["aws", "azure", "gcp"].map((cloud) => (
          <label key={cloud} className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={selectedClouds.includes(cloud)}
              onChange={() => toggleCloud(cloud)}
            />
            <span className="capitalize">{cloud}</span>
          </label>
        ))}
      </div>

      {/* 그래프 */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Legend />
          {selectedClouds.map((cloud) => (
            <Line
              key={cloud}
              type="monotone"
              dataKey={cloud}
              stroke={cloudColors[cloud]}
              name={cloud.toUpperCase()}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
