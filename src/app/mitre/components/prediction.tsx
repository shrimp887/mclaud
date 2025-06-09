"use client";

import { useEffect, useState } from "react";

export default function PredictionPage() {
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    async function loadViz() {
      // 1. Viz.js 스크립트를 브라우저에 동적으로 로드
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/viz.js"; // public 디렉토리에 있어야 함
        script.onload = () => resolve();
        script.onerror = () => reject("Viz.js load error");
        document.body.appendChild(script);
      });

      try {
        // 2. .dot 파일 로드
        const res = await fetch("/graphviz/test.dot");
        if (!res.ok) throw new Error(`.dot file fetch failed: ${res.status}`);
        const dotText = await res.text();

        // 3. Viz 함수 호출 (타입 안전하게 unknown → 명시적 캐스팅)
        const svgOutput = await ((window as unknown) as {
          Viz: (src: string, opts?: { engine?: string }) => Promise<string>;
        }).Viz(dotText, { engine: "circo" });

        // 4. SVG 출력
        setSvg(svgOutput);
      } catch (err) {
        console.error("Graph render failed:", err);
        setSvg(`<div class="text-red-600">⚠️ 시각화 실패: ${String(err)}</div>`);
      }
    }

    loadViz();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">예측 시나리오 (viz.js 기반)</h1>
      <div
        id="graph-container"
        className="border bg-white shadow rounded overflow-auto h-[80vh]"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

