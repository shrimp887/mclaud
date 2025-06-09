"use client";
import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function MonthlyTTPChart() {
  const { months, counts } = useMemo(() => {
    const now = new Date();
    const months: string[] = [];
    const counts: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${date.getMonth() + 1}월`);
      counts.push(Math.floor(Math.random() * 60) + 20);
    }

    return { months, counts };
  }, []);

  const chartOptions: ApexOptions = {
    chart: { type: "bar", height: 200 },
    xaxis: { categories: months },
    colors: ["#3b82f6"],
  };

  const chartSeries = [
    { name: "TTP 매핑 수", data: counts },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4 mt-4">
      <div className="font-bold mb-2">월별 TTP 매핑 수</div>
      <ApexChart
        options={chartOptions}
        series={chartSeries}
        type="bar"
        height={220}
      />
    </div>
  );
}

