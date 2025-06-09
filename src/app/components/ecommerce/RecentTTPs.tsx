"use client";
import React, { useMemo } from "react";
import Image from "next/image";

interface AlertItem {
  cloud: "AWS" | "Azure" | "GCP";
  tid: string;
  detectedAt: Date;
}

const cloudLogo: Record<AlertItem["cloud"], string> = {
  AWS: "/images/aws-icon.png",
  Azure: "/images/azure-icon.png",
  GCP: "/images/gcp-icon.png",
};

const sampleTIDs = [
  "T1059", "T1078.001", "T1003", "T1110", "T1566.002",
  "T1021.004", "T1203", "T1047", "T1087.001", "T1053"
];

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 30) return "방금 전";
  if (seconds < 60) return `${seconds}초 전`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}분 전`;
}

export default function RecentTTPs() {
  const alerts: AlertItem[] = useMemo(() => {
    const clouds: AlertItem["cloud"][] = ["AWS", "Azure", "GCP"];

    const generated = Array.from({ length: 5 }).map(() => {
      const offset = Math.floor(Math.random() * 300); // 0~5분 전
      return {
        cloud: clouds[Math.floor(Math.random() * clouds.length)],
        tid: sampleTIDs[Math.floor(Math.random() * sampleTIDs.length)],
        detectedAt: new Date(Date.now() - offset * 1000),
      };
    });

    // ✅ 최신 순 정렬 (가장 최근 항목이 위로)
    return generated.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6 h-48 flex flex-col justify-between">
      <div className="font-bold text-lg mb-3">최근 탐지된 TTP</div>
      <ul className="text-base space-y-3 overflow-y-auto max-h-32 pr-1">
        {alerts.map((alert, i) => (
          <li key={i} className="flex items-center">
            <Image
              src={cloudLogo[alert.cloud]}
              alt={alert.cloud}
              width={24}
              height={24}
              className="mr-3"
            />
            <span className="font-bold">{alert.tid}</span>
            <span className="ml-3 text-sm text-gray-600">
              {alert.cloud} / {timeAgo(alert.detectedAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

