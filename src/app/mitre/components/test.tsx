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
  alert?: boolean;
}

interface ApiResponseEntry {
  index: string;
  buckets: LogBucket[];
}

interface AlertData {
  timestamp: string;
}

const cloudColors: Record<string, string> = {
  aws: "#1f77b4",
  azure: "#2ca02c",
  gcp: "#ff7f0e",
};

export default function TestChart() {
  const [data, setData] = useState<SeriesData[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  // 시작 시간 = 현재 - 60초
  const start = new Date(Date.now() - 60 * 1000).toISOString();
  const end = new Date().toISOString();

  // 📥 탐지 이벤트 불러오기
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/logs/webhook");
      const json: AlertData[] = await res.json();

      const timestamps = json.map((alert) => {
        const d = new Date(alert.timestamp);
        d.setMilliseconds(0); // 밀리초 제거
        return d.toISOString().slice(0, 19); // yyyy-MM-ddTHH:mm:ss
      });

      setAlerts(timestamps);
    } catch (e) {
      console.error("웹훅 알림 불러오기 실패:", e);
    }
  }, []);

  // 📈 로그 + 탐지 이벤트 함께 불러오기
  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append("start", start);
      params.append("end", end);

      const res = await fetch(`/api/logs?${params.toString()}`);
      const raw: ApiResponseEntry[] = await res.json();

      const combined: { [key: string]: SeriesData } = {};

      raw.forEach((entry: ApiResponseEntry) => {
        const source = entry.index.replace("-logs", "");
        entry.buckets.forEach((b: LogBucket) => {
          if (!combined[b.key_as_string]) {
            combined[b.key_as_string] = { timestamp: b.key_as_string };
          }

          const key = source as keyof Omit<SeriesData, "timestamp" | "alert">;
          combined[b.key_as_string][key] = b.doc_count;
        });
      });

      const sorted: SeriesData[] = Object.values(combined)
        .map((d) => ({
          ...d,
          alert: alerts.includes(d.timestamp.slice(0, 19)),
        }))
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

      // 누락된 alert timestamp가 있다면 dummy point 추가
      alerts.forEach((ts) => {
        if (!sorted.some((d) => d.timestamp.slice(0, 19) === ts)) {
          sorted.push({ timestamp: ts, alert: true });
        }
      });

      sorted.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // 최근 60초만 유지
      setData(sorted.slice(-60));
    } catch (e) {
      console.error("데이터 불러오기 실패:", e);
    }
  }, [alerts, start, end]); // ✅ 의존성 누락 수정

  // 🔁 1초마다 데이터 새로 고침
  useEffect(() => {
    fetchAlerts();
    fetchData();
    const interval = setInterval(() => {
      fetchAlerts();
      fetchData();
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchAlerts, fetchData]);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="text-lg font-bold mb-4">클라우드 로그 실시간 그래프 (1초 단위)</h3>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Legend />
          {["aws", "azure", "gcp"].map((cloud) => (
            <Line
              key={cloud}
              type="monotone"
              dataKey={cloud}
              stroke={cloudColors[cloud]}
              name={cloud.toUpperCase()}
              dot={false}
            />
          ))}
          <Line
            type="monotone"
            dataKey="alert"
            name="탐지 이벤트"
            stroke="transparent"
            dot={({ cx, cy, payload }) =>
              payload.alert ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={6}
                  fill="red"
                  stroke="black"
                  strokeWidth={1}
                />
              ) : null
            }
            legendType="circle"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

