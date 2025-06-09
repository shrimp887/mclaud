"use client";

import dynamic from "next/dynamic";

const PredictionGraph = dynamic(() => import("./prediction"), {
  ssr: false,
});

export default function PredictionWrapper() {
  return <PredictionGraph />;
}

