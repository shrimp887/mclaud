"use client";

import React from "react";
import TimeSeriesGraph from "./components/time_series_graph";
import Scenario from "./components/scenario";

export default function Page() {
  return (
    <div className="p-6 space-y-10">
      <TimeSeriesGraph />
      <Scenario />
    </div>
  );
}
