"use client";
import React from "react";
import Image from "next/image";

interface Props {
  cloudKeys: ("aws-logs" | "azure-logs" | "gcp-logs")[];
}

const cloudMeta = {
  "aws-logs": { name: "AWS", logo: "/images/aws-icon.png" },
  "azure-logs": { name: "Azure", logo: "/images/azure-icon.png" },
  "gcp-logs": { name: "GCP", logo: "/images/gcp-icon.png" },
} as const;

export default function CloudLiveStatusCards({ cloudKeys }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {cloudKeys.map((cloud) => (
        <div
          key={cloud}
          className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow h-28"
        >
          <Image
            src={cloudMeta[cloud].logo}
            alt={cloudMeta[cloud].name}
            width={32}
            height={32}
            className="mb-2"
          />
          <div className="font-bold">{cloudMeta[cloud].name}</div>
          <div className="flex items-center mt-1">
            <span className="w-3 h-3 mr-2 rounded-full bg-green-500"></span>
            <span className="text-sm">데이터 수신 중</span>
          </div>
        </div>
      ))}
    </div>
  );
}

