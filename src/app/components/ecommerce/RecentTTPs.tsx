"use client";
import React from "react";
import Image from "next/image";
import { AttackPoint } from "./AttackGlobe"; // AttackGlobe에서 export한 타입

const cloudLogo: Record<string, string> = {
  AWS: "/images/aws-icon.png",
  Azure: "/images/azure-icon.png",
  GCP: "/images/gcp-icon.png",
};

function timeAgo(dateString: string): string {
  // dateString = pt.detectedAt (예: '2025. 6. 10. 오후 12:41:22')
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 30) return "방금 전";
  if (seconds < 60) return `${seconds}초 전`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}분 전`;
}

export default function RecentTTPs({ latestTTPs }: { latestTTPs: AttackPoint[] }) {
  return (
    <div className="bg-white rounded-lg px-6 h-48 flex flex-col justify-between">
      <div className="font-bold text-lg py-3">최근 탐지된 TTP</div>
      <ul className="rounded-lg px-5 py-2 text-base space-y-3 overflow-y-auto max-h-32 mb-4"
       style={{
            boxShadow: "inset 0 0 6px 1px rgba(106, 104, 104, 0.22)"
        }}
      >
        {latestTTPs.length === 0 && (
          <li className="text-gray-400">탐지 내역 없음</li>
        )}
        {latestTTPs.map((pt, i) => (
          <li key={i} className="flex items-center">
            <Image
              src={cloudLogo[pt.cloud] || "/images/aws-icon.png"}
              alt={pt.cloud}
              width={24}
              height={24}
              className="mr-3"
            />
            <span className="font-bold">{pt.ttp.split(":")[0]}</span>
            <span className="ml-3 text-sm text-gray-600">
              {pt.cloud} / {timeAgo(pt.detectedAt)}
            </span>
            <span className="ml-3 text-xs text-gray-400">{pt.ip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

