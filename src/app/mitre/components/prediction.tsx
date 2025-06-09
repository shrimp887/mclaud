"use client";

import { useEffect, useRef, useState } from "react";

export default function PredictionPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);
  const currentTIDsRef = useRef<string[]>(["n0", "n1", "n2", "n3", "n4", "n5"]);

  useEffect(() => {
    const renderGraph = async () => {
      try {
        console.log("🎯 [1] prediction.tsx 실행 시작");

        // @ts-expect-error: viz.js has no types
        const VizModule = (await import("@aduh95/viz.js")).default;
        console.log("📦 [2] viz.js import 완료");

        const { render } = await VizModule();
        console.log("⚙️ [3] render 함수 추출 완료");

        const dot = await fetch("/graphviz/test.dot").then((res) => {
          if (!res.ok) throw new Error("DOT 파일 불러오기 실패");
          return res.text();
        });
        console.log("📄 [4] .dot 파일 로드 완료:\n", dot);

        const svg = render(dot, { engine: "circo" });
        console.log("🖼 [5] SVG 변환 완료");

        if (!containerRef.current) {
          console.error("❌ [6] containerRef가 null입니다");
          return;
        }

        containerRef.current.innerHTML = svg;

        // 모든 노드를 흐리게 처리
        containerRef.current.querySelectorAll("g.node").forEach((node) => {
          node.setAttribute("opacity", "0.1");
        });

        // 초기 노드(n0~n5) 강조
        currentTIDsRef.current.forEach((id) => {
          const node = containerRef.current?.querySelector(`#${CSS.escape(id)}`);
          if (node) node.setAttribute("opacity", "1");
        });

        setInitialized(true);
        console.log("✅ [7] 초기 렌더링 완료");
      } catch (err) {
        console.error("❌ 예외 발생:", err);
      }
    };

    renderGraph();
  }, []);

  // 예측 결과 기반 강조
  useEffect(() => {
    if (!initialized) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/prediction");
        const { TID } = await res.json();
        if (!TID) return;
        console.log("📥 [API] TID 수신:", TID);
        highlightIfConnected(TID);
      } catch (err) {
        console.error("❌ [API] prediction fetch 실패:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [initialized]);

  // 연결된 노드 강조
  const highlightIfConnected = (targetTID: string) => {
    const svgRoot = containerRef.current;
    if (!svgRoot) return;

    const edges = svgRoot.querySelectorAll("g.edge");

    edges.forEach((edge) => {
      const title = edge.querySelector("title")?.textContent ?? "";
      const [from, to] = title.split("->").map((s) => s.trim());

      if (from && to && to.includes(targetTID) && currentTIDsRef.current.includes(from)) {
        if (!currentTIDsRef.current.includes(to)) {
          currentTIDsRef.current.push(to);
        }

        const node = svgRoot.querySelector(`#${CSS.escape(to)}`);
        if (node) {
          node.setAttribute("opacity", "1");
          node.querySelector("polygon")?.setAttribute("fill", "#ffcc00"); // 노란색
          console.log("🎯 [노드 강조] 연결된 TID 강조:", to);
        }
      }
    });
  };

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "800px", border: "1px solid #ccc" }}
    ></div>
  );
}

