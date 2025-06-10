"use client";
import React from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface MonthlyTTPChartProps {
  juneCount: number;
}

export default function MonthlyTTPChart({ juneCount }: MonthlyTTPChartProps) {
  // 1~5월 고정값(원하는 값으로 수정 가능)
  const fixedCounts = [32, 21, 40, 28, 15];
  const months = ["1월", "2월", "3월", "4월", "5월", "6월"];
  const counts = [...fixedCounts, juneCount];

  const chartOptions: ApexOptions = {
    chart: { type: "bar", height: 200 },
    xaxis: { categories: months },
    colors: ["#3b82f6"],
  };

  const chartSeries = [
    { name: "TTP 매핑 수", data: counts },
  ];

  return (
    <div className="bg-white rounded-lg p-4">
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

