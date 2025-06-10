"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { graphviz } from "d3-graphviz";

export default function PredictionPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const currentActiveNodesRef = useRef<string[]>(["n0", "n1", "n2"]);
  const nodeTIDMap = useRef<Record<string, string>>({});
  const graphEdges = useRef<Record<string, string[]>>({});

  useEffect(() => {
    const renderGraph = async () => {
      try {
        const dot = await fetch("/graphviz/prediction_tree.dot").then((res) => {
          if (!res.ok) throw new Error("DOT 파일 로드 실패");
          return res.text();
        });

        if (!containerRef.current) return;

        graphviz(containerRef.current)
          .engine("circo")
          .zoom(true)
          .renderDot(dot)
          .on("end", () => {
            const svg = d3.select(containerRef.current).select("svg");
            const svgNode = svg.node() as SVGSVGElement | null;

            if (svgNode) {
              const bbox = svgNode.getBBox();
              svg
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("preserveAspectRatio", "xMidYMid meet")
                .attr(
                  "viewBox",
                  `${bbox.x - 50} ${bbox.y - 50} ${bbox.width + 100} ${bbox.height + 100}`
                );
            }

            svg.selectAll("g.node").each(function () {
              const node = d3.select(this);
              const id = node.attr("id");
              const texts = node.selectAll("text");

              let score: number | null = null;

              texts.each(function () {
                const textEl = d3.select(this);
                const content = textEl.text();
                const match = content.match(/Score[:=]?\s?([\d.]+)/i);
                if (match) {
                  score = parseFloat(match[1]);
                }
              });

              if (score !== null && id) {
                const gamma = 2.2;
                const maxScore = 0.09;
                const normalized = Math.min(score / maxScore, 1);
                const adjusted = Math.pow(normalized, gamma);
                const multiplier = 1 - adjusted;
                const brightnessBoost = (1 - normalized) * 0.2;
                const boostedMultiplier = Math.min(multiplier + brightnessBoost, 1);

                const baseR = 160;
                const baseG = 120;
                const baseB = 255;

                const r = Math.floor(baseR * boostedMultiplier);
                const g = Math.floor(baseG * boostedMultiplier);
                const b = Math.floor(baseB * boostedMultiplier);
                const purple = `rgb(${r}, ${g}, ${b})`;

                node.selectAll("polygon").attr("fill", purple).style("fill", purple);
              }

              texts.each(function () {
                const textEl = d3.select(this);
                if (textEl.text().includes("Score:")) {
                  textEl.style("display", "none");
                }
              });

              const tidText = node.select("text").text();
              const tid = tidText.split("\n")[0].trim();
              if (id && tid.startsWith("T")) {
                nodeTIDMap.current[id] = tid;
              }
            });

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

            currentActiveNodesRef.current.forEach((id) => {
              const node = svg.select(`#${id}`);
              node.attr("opacity", 1);
              node.selectAll("polygon").attr("fill", "red").style("fill", "red");
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
        const newTID = data.map((e) => e.TID).reverse().find((tid) => !seenTIDs.has(tid));
        if (!newTID) return;

        const lastNode = currentActiveNodesRef.current.at(-1);
        if (!lastNode) return;

        const children = graphEdges.current[lastNode] || [];
        const match = children.find((child) => nodeTIDMap.current[child] === newTID);
        if (match && !currentActiveNodesRef.current.includes(match)) {
          currentActiveNodesRef.current.push(match);

          const svg = d3.select(containerRef.current).select("svg");
          const node = svg.select(`#${match}`);
          node.attr("opacity", 1);
          node.selectAll("polygon").attr("fill", "red").style("fill", "red");

          console.log(`🔴 새로운 탐지: ${newTID} → 노드 ${match} 강조`);

          const zoomGroup = svg.select("g");
          const svgNode = svg.node() as SVGSVGElement | null;
          const matchedNode = node.node() as SVGGElement | null;

          if (svgNode && matchedNode) {
            const nodeBox = matchedNode.getBBox();
            const centerX = nodeBox.x + nodeBox.width / 2;
            const centerY = nodeBox.y + nodeBox.height / 2;

            const vb = svgNode.viewBox.baseVal;
            const viewportWidth = vb.width || 800;
            const viewportHeight = vb.height || 600;

            const scale = 3.5;
            const translateX = viewportWidth / 2 - centerX * scale;
            const translateY = viewportHeight / 2 - centerY * scale;

            console.log("📦 확대 이동 정보:", {
              centerX,
              centerY,
              viewportWidth,
              viewportHeight,
              translateX,
              translateY,
            });

            zoomGroup
              .transition()
              .duration(750)
              .attr("transform", `translate(${translateX}, ${translateY}) scale(${scale})`);
          }
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
        height: "900px",
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
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    </div>
  );
}

