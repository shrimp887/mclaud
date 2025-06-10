"use client";
import { useState } from "react";

export default function Todo() {
  const [items, setItems] = useState([
    { text: "Review IAM user access", done: false },
    { text: "Check failed login attempts", done: false },
    { text: "Update cloud firewall rules", done: false },
    { text: "Check MFA status", done: false },
    { text: "Audit admin role assignments", done: false },
    { text: "Review security group changes", done: false },
    { text: "Check alerting system status", done: false },
    { text: "Backup critical data", done: false },
  ]);

  function toggle(idx: number) {
    setItems(items =>
      items.map((item, i) =>
        i === idx ? { ...item, done: !item.done } : item
      )
    );
  }

  return (
    <div className="px-3">
        {/* 제목만 */}
        <div className="rounded-lg py-1.5 mt-1.5 mb-4 flex flex-col justify-center items-center bg-[#a7cce6] text-gray-800 text-lg font-semibold">
            Action Items
        </div>
        {/* 체크박스 리스트만 따로 박스 처리 */}
        <div className=" shadow-inner rounded-lg px-4 py-3 w-full"
            style={{
            boxShadow: "inset 0 0 6px 1px rgba(106, 104, 104, 0.22)" // 진하고 넓은 그림자
        }}>
            <ul className="p-3 space-y-10 text-sm">
            {items.map((item, idx) => (
                <li key={idx} className="flex items-center">
                <input
                    type="checkbox"
                    className="mr-2 accent-blue-600"
                    checked={item.done}
                    onChange={() => toggle(idx)}
                />
                <span className={item.done ? "line-through text-gray-400" : ""}>
                    {item.text}
                </span>
                </li>
            ))}
            </ul>
        </div>
    </div>

  );
}

