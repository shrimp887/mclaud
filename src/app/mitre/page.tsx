"use client";

import React from "react";
import TimeSeriesGraph from "./components/time_series_graph";
import Scenario from "./components/scenario";

export default function Page() {
  return (
    <div className="p-6 space-y-10">
      <h2 className="text-2xl font-bold mb-4">MITRE ATT&CK 탐지 시나리오</h2>
      <TimeSeriesGraph />
      <Scenario />
    </div>
  );
}
