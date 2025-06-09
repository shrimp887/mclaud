"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { graphviz } from "d3-graphviz";

export default function PredictionPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const currentActiveNodesRef = useRef<string[]>([
    "n0", "n1", "n2", "n3", "n4", "n5"
  ]);

  const nodeTIDMap = useRef<Record<string, string>>({});
  const graphEdges = useRef<Record<string, string[]>>({});

  useEffect(() => {
    const renderGraph = async () => {
      try {
        const dot = await fetch("/graphviz/test.dot").then((res) => {
          if (!res.ok) throw new Error("DOT 파일 로드 실패");
          return res.text();
        });

        if (!containerRef.current) return;

        graphviz(containerRef.current)
          .engine("circo")
          .zoom(true)
          .renderDot(dot)
          .on("end", () => {
            const svg = d3.select(containerRef.current);

            // 노드 → TID 매핑
            svg.selectAll("g.node").each(function () {
              const node = d3.select(this);
              const id = node.attr("id");
              const text = node.select("text").text();
              const tid = text.split("\n")[0].trim();
              if (id && tid.startsWith("T")) {
                nodeTIDMap.current[id] = tid;
              }
            });

            // 엣지 → 연결 관계 추출
            svg.selectAll("g.edge").each(function () {
              const edge = d3.select(this);
              const titles = edge.select("title").text().split("->").map((s) => s.trim());
              const [src, dst] = titles;
              if (src && dst) {
                if (!graphEdges.current[src]) {
                  graphEdges.current[src] = [];
                }
                graphEdges.current[src].push(dst);
              }
            });

            // 초기 강조 노드 빨간색
            currentActiveNodesRef.current.forEach((id) => {
              const node = svg.select(`#${id}`);
              node.attr("opacity", 1);
              node.selectAll("polygon")
                .attr("fill", "red")
                .style("fill", "red"); // 강제 오버라이드
            });

            console.log("✅ 초기 노드 강조 완료");
          });
      } catch (err) {
        console.error("❌ 그래프 렌더링 실패:", err);
      }
    };

    renderGraph();

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/prediction");
        const data: { TID: string }[] = await res.json();

        const seenTIDs = new Set(
          currentActiveNodesRef.current.map((nid) => nodeTIDMap.current[nid])
        );
        const newTID = data
          .map((e) => e.TID)
          .reverse()
          .find((tid) => !seenTIDs.has(tid));

        if (!newTID) return;

        const lastNode = currentActiveNodesRef.current.at(-1);
        if (!lastNode) return;

        const children = graphEdges.current[lastNode] || [];
        const match = children.find((child) => nodeTIDMap.current[child] === newTID);
        if (match && !currentActiveNodesRef.current.includes(match)) {
          currentActiveNodesRef.current.push(match);

          const node = d3.select(containerRef.current).select(`#${match}`);
          node.attr("opacity", 1);
          node.selectAll("polygon")
            .attr("fill", "red")
            .style("fill", "red");

          console.log(`🔴 새로운 탐지: ${newTID} → 노드 ${match} 강조`);
        }
      } catch (e) {
        console.error("❌ TID fetch 실패", e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        height: "700px",
        overflow: "auto",
        backgroundColor: "#fff",
        border: "2px solid #aaa",
        borderRadius: "10px",
        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        position: "relative",
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: "1000px",
          transform: "scale(0.6)",
          transformOrigin: "top left",
        }}
      />
    </div>
  );
}

