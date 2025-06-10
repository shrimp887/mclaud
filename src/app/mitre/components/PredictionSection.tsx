"use client";

import { useEffect, useState } from "react";
import PredictionPage from "./prediction";

interface Alert {
  TID: string;
}

export default function PredictionSection() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showGraph, setShowGraph] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/prediction");
        const data: Alert[] = await res.json();

        // 중복 제거된 TID들만
        const uniqueTIDs = Array.from(
          new Map(data.map((e) => [e.TID, e])).values()
        );

        setAlerts(uniqueTIDs);

        if (uniqueTIDs.length >= 3 && !showGraph) {
          setTimeout(() => {
            setShowGraph(true);
          }, 2000); // 2초 대기 후 그래프 표시
        }
      } catch (e) {
        console.error("TID fetch 실패", e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [showGraph]);

  return (
    <div className="flex flex-col items-center space-y-6">
      {!showGraph && (
        <>
          <div className="flex flex-wrap gap-3 justify-center">
            {alerts.slice(0, 3).map((alert, idx) => (
              <div
                key={idx}
                className="bg-red-600 text-white px-4 py-2 rounded shadow text-sm font-mono"
              >
                {alert.TID}
              </div>
            ))}
          </div>

          {alerts.length >= 3 && (
            <div className="flex flex-col items-center mt-4 space-y-2">
              <div className="text-lg font-semibold text-gray-800">Predicting...</div>
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-red-500 border-gray-300" />
            </div>
          )}
        </>
      )}

      {showGraph && <PredictionPage />}
    </div>
  );
}

