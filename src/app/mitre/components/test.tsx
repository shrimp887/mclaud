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
  DotProps,
} from "recharts";

interface SeriesData {
  timestamp: string;
  index: number;
  aws: number;
  azure: number;
  gcp: number;
  raw_aws: number;
  raw_azure: number;
  raw_gcp: number;
}

interface ApiResponseEntry {
  index: string;
  buckets: {
    key_as_string: string;
    doc_count: number;
  }[];
}

interface AlertData {
  timestamp: string;
  trigger: string;
  cloud: string;
}

const cloudColors: Record<string, string> = {
  aws: "#1f77b4",
  azure: "#2ca02c",
  gcp: "#ff7f0e",
};

function parseTimeRange(range: string): number {
  switch (range) {
        case "1h": return 60 * 60 *1000;
        case "30m": return 30 * 60 * 1000;
    case "10m": return 10 * 60 * 1000;
    case "5m": return 5 * 60 * 1000;
    case "3m": return 3 * 60 * 1000;
    case "1m":
    default: return 60 * 1000;
  }
}

const clamp = (val: number) => (val > 80 ? 80 : val);

const CustomDot = ({ cx, cy, payload, dataKey }: DotProps & { dataKey?: string }) => {
  const rawKey = `raw_${dataKey}` as keyof SeriesData;
  const rawVal = payload[rawKey] as number;
  if (rawVal >= 80) {
    return (
      <circle cx={cx} cy={cy} r={5} fill="red" stroke="black" strokeWidth={1} />
    );
  }
  return null;
};

export default function TestChart() {
  const [data, setData] = useState<SeriesData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [timeRange, setTimeRange] = useState("1m");
  const [initialized, setInitialized] = useState(false);
  const [selectedClouds, setSelectedClouds] = useState(["aws", "azure", "gcp"]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/webhook");
      const json: AlertData[] = await res.json();
      const cleaned = json.map((a) => ({
        ...a,
        timestamp: new Date(a.timestamp).toISOString().slice(0, 19),
        cloud: a.cloud.toLowerCase(),
      }));
      setAlerts(cleaned);
    } catch (e) {
      console.error("웹훅 알림 불러오기 실패:", e);
    }
  }, []);

  const fetchData = useCallback(async () => {
    const now = new Date();
    const range = initialized ? 2000 : parseTimeRange(timeRange);
    const start = new Date(now.getTime() - range).toISOString();
    const end = new Date(now.getTime() + 2000).toISOString();

    try {
      const params = new URLSearchParams();
      params.append("start", start);
      params.append("end", end);

      const res = await fetch(`/api/logs?${params.toString()}`);
      const raw: ApiResponseEntry[] = await res.json();

      const byTime: Record<string, Partial<SeriesData>> = {};

      raw.forEach((entry) => {
        const source = entry.index.replace("-logs", "");
        entry.buckets.forEach((b) => {
          const ts = b.key_as_string.slice(0, 19);
          if (!byTime[ts]) byTime[ts] = { timestamp: ts };
          const rawKey = `raw_${source}` as keyof SeriesData;
          const clampKey = source as keyof SeriesData;
          (byTime[ts][rawKey] as number) = b.doc_count;
          (byTime[ts][clampKey] as number) = clamp(b.doc_count);
        });
      });

      const sorted = Object.entries(byTime)
        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
        .map(([ts, obj]) => ({
          timestamp: ts,
          index: 0,
          aws: obj.aws ?? 0,
          azure: obj.azure ?? 0,
          gcp: obj.gcp ?? 0,
          raw_aws: obj.raw_aws ?? 0,
          raw_azure: obj.raw_azure ?? 0,
          raw_gcp: obj.raw_gcp ?? 0,
        }));

      const MAX_LENGTH = Math.ceil(parseTimeRange(timeRange) / 1000);

      setData((prev) => {
        if (!initialized) {
          setInitialized(true);
          return sorted;
        }

        const unique = sorted.filter((item) => {
          const existing = prev.find((d) => d.timestamp === item.timestamp);
          return !existing || (
            existing.aws !== item.aws ||
            existing.azure !== item.azure ||
            existing.gcp !== item.gcp
          );
        });

        if (unique.length === 0) return prev;

        const updated = [...prev, ...unique];
        const sliced = updated.slice(-MAX_LENGTH);
        return sliced;
      });
    } catch (e) {
      console.error("데이터 불러오기 실패:", e);
    }
  }, [timeRange, initialized]);

  useEffect(() => {
    fetchAlerts();
    fetchData();
    const interval = setInterval(() => {
      fetchAlerts();
      fetchData();
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchAlerts, fetchData]);

  const handleCloudToggle = (cloud: string) => {
    setSelectedClouds((prev) =>
      prev.includes(cloud) ? prev.filter((c) => c !== cloud) : [...prev, cloud]
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h3 className="text-lg font-bold mb-4">클라우드 로그 실시간 그래프</h3>

      {/* 전체 알림 리스트 */}
      {selectedClouds.length > 0 && (
        <div className="flex gap-2 overflow-x-auto max-w-full mb-2">
          {[...alerts]
            .filter((a) => selectedClouds.includes(a.cloud))
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map((alert, idx) => {
              const bgColor =
                alert.cloud === "aws"
                  ? "bg-blue-100 text-blue-800"
                  : alert.cloud === "azure"
                  ? "bg-green-100 text-green-800"
                  : "bg-orange-100 text-orange-800";
              return (
                <div
                  key={`all-${idx}`}
                  className={`px-2 py-1 text-xs font-semibold rounded shadow-sm whitespace-nowrap ${bgColor}`}
                  title={`🕒 ${alert.timestamp}\n☁️ ${alert.cloud.toUpperCase()}`}
                >
                  {alert.trigger}
                </div>
              );
            })}
        </div>
      )}

      {/* 클라우드별 최근 알림 */}
      {["aws", "azure", "gcp"].map((cloud) => {
        if (!selectedClouds.includes(cloud)) return null;
        const cloudAlerts = alerts
          .filter((a) => a.cloud === cloud)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .slice(-20);
        const bgColor =
          cloud === "aws"
            ? "bg-blue-100 text-blue-800"
            : cloud === "azure"
            ? "bg-green-100 text-green-800"
            : "bg-orange-100 text-orange-800";
        return (
          <div key={cloud} className="flex gap-2 overflow-x-auto max-w-full mb-1">
            {cloudAlerts.map((alert, idx) => (
              <div
                key={`${cloud}-${idx}`}
                className={`px-2 py-1 text-xs font-semibold rounded shadow-sm whitespace-nowrap ${bgColor}`}
                title={`🕒 ${alert.timestamp}\n☁️ ${alert.cloud.toUpperCase()}`}
              >
                {alert.trigger}
              </div>
            ))}
          </div>
        );
      })}

      {/* 시간 범위 및 필터 */}
      <div className="mb-4 mt-4 flex gap-4 items-center">
        <label>시간 범위:</label>
        <select
          value={timeRange}
          onChange={(e) => {
            setInitialized(false);
            setData([]);
            setTimeRange(e.target.value);
          }}
          className="border px-2 py-1 rounded"
        >
          <option value="1m">최근 1분</option>
          <option value="3m">최근 3분</option>
          <option value="5m">최근 5분</option>
          <option value="10m">최근 10분</option>
                  <option value="30m">최근 30분</option>
                  <option value="1h">최근 1시간</option>
        </select>

        <div className="ml-6 flex gap-4">
          {["aws", "azure", "gcp"].map((cloud) => (
            <label key={cloud} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={selectedClouds.includes(cloud)}
                onChange={() => handleCloudToggle(cloud)}
              />
              {cloud.toUpperCase()}
            </label>
          ))}
        </div>
      </div>

      {/* 그래프 */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
		  <XAxis
			dataKey="timestamp"
			tickFormatter={(tick, index) => {
			  if (index === 0) {
				const labelMap: Record<string, string> = {
				  "1m": "1분 전",
				  "3m": "3분 전",
				  "5m": "5분 전",
				  "10m": "10분 전",
				  "30m": "30분 전",
				  "1h": "1시간 전",
				};
				return labelMap[timeRange] || "";
			  }
			  return "";
			}}
			interval="preserveStartEnd"
			minTickGap={30}
		  />

          <YAxis domain={[0, 80]} />
          <Tooltip
            formatter={(_, name, props) => {
              const point = props.payload as SeriesData;
              const raw = name === "AWS" ? point.raw_aws :
                          name === "AZURE" ? point.raw_azure : point.raw_gcp;
              return [`${raw}`, name];
            }}
            labelFormatter={(ts) => ts}
          />
          <Legend />
          {selectedClouds.map((cloud) => (
            <Line
              key={cloud}
              type="monotone"
              dataKey={cloud}
              stroke={cloudColors[cloud]}
              name={cloud.toUpperCase()}
              dot={<CustomDot dataKey={cloud} />}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
