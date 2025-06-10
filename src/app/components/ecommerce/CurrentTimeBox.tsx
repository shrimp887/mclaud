// components/ecommerce/CurrentTimeBox.tsx
"use client";
import { useEffect, useState } from "react";

export default function CurrentTimeBox() {
  const [utc, setUTC] = useState("");
  const [kst, setKST] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const utcString = now.toISOString().slice(0, 19).replace("T", " ");
      // KST = UTC+9
      const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      const kstString = kstDate.toISOString().slice(0, 19).replace("T", " ");
      setUTC(utcString + " UTC");
      setKST(kstString + " KST");
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-white shadow-inner rounded-lg h-32 px-5 py-4 flex flex-col items-start">
      <span className="w-full px-5 py-1 rounded-lg text-md font-semibold text-gray-800 mb-2 bg-[#a7cce6]">Current Time</span>
      <span className="text-lg px-5 font-bold text-gray-800">{utc}</span>
      <span className="text-lg px-5 font-bold text-blue-700">{kst}</span>
    </div>
  );
}

