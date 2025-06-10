"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { graphviz } from "d3-graphviz";

export default function PredictionPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const currentActiveNodesRef = useRef<string[]>(["n0", "n1", "n2"]);
  const nodeTIDMap = useRef<Record<string, string>>({});
  const graphEdges = useRef<Record<string, string[]>>({});
  const [nextTTPs, setNextTTPs] = useState<string[]>([]);
  const [latestTID, setLatestTID] = useState<string | null>(null);
  const svgSelectionRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);
  const initialTransformRef = useRef<d3.ZoomTransform | null>(null);

  useEffect(() => {
    const highlightNextCandidates = (activeId: string) => {
      const svg = d3.select(containerRef.current).select("svg");
      const nextNodes = graphEdges.current[activeId] || [];

      nextNodes.forEach((childId) => {
        const node = svg.select(`#${childId}`);
        if (node.empty()) return;

        const polygon = node.select("polygon");
        const currentFill = polygon.style("fill");
        if (currentFill === "red") return;

        polygon.attr("fill", "orange").style("fill", "orange");
      });

      return nextNodes.map((id) => nodeTIDMap.current[id]).filter(Boolean);
    };

    const renderGraph = async () => {
      try {
        const dot = await fetch("/graphviz/prediction_tree.dot").then((res) => {
          if (!res.ok) throw new Error("DOT 파일 로드 실패");
          return res.text();
        });

        if (!containerRef.current) return;

        graphviz(containerRef.current)
          .engine("circo")
          .zoom(false)
          .renderDot(dot)
          .on("end", () => {
            const svg = d3.select(containerRef.current).select("svg");
            const svgSelection = svg as unknown as d3.Selection<SVGSVGElement, unknown, null, undefined>;
            const svgNode = svg.node() as SVGSVGElement | null;
            if (!svgNode) return;

            const bbox = svgNode.getBBox();
            svg
              .attr("width", "100%")
              .attr("height", "100%")
              .attr("preserveAspectRatio", "xMidYMid meet")
              .attr("viewBox", `${bbox.x - 50} ${bbox.y - 50} ${bbox.width + 100} ${bbox.height + 100}`);

            const zoom = d3.zoom<SVGSVGElement, unknown>()
              .scaleExtent([0.1, 100])
              .on("zoom", (event) => {
                svg.select("g").attr("transform", event.transform);
              });

            svgSelection.call(zoom);
            zoomRef.current = zoom;
            svgSelectionRef.current = svgSelection;

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
                const r = Math.floor(160 * boostedMultiplier);
                const g = Math.floor(120 * boostedMultiplier);
                const b = Math.floor(255 * boostedMultiplier);
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

            const lastInit = currentActiveNodesRef.current.at(-1);
            if (lastInit) {
              const ttpList = highlightNextCandidates(lastInit);
              setNextTTPs(ttpList);
              setLatestTID(nodeTIDMap.current[lastInit]);
            }

            const centerNodeId = "n2";
            const centerNode = svg.select(`#${centerNodeId}`);
            const centerG = centerNode.node() as SVGGElement | null;

            if (svgNode && centerG && zoomRef.current) {
              const nodeBox = centerG.getBBox();
              const centerX = nodeBox.x + nodeBox.width / 2;
              const centerY = nodeBox.y + nodeBox.height / 2;

              const vb = svgNode.viewBox.baseVal;
              const viewportWidth = vb.width || 800;
              const viewportHeight = vb.height || 600;

              const scale = 1;
              const translateX = viewportWidth / 2 - centerX * scale;
              const translateY = viewportHeight / 2 - centerY * scale;

              const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);
              svgSelection.call(zoomRef.current.transform, transform);
              initialTransformRef.current = transform;
            }
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

          svg.selectAll("g.node").each(function () {
            const node = d3.select(this);
            const polygon = node.select("polygon");
            if (polygon.style("fill") === "orange") {
              const text = node.select("text").text();
              const scoreMatch = text.match(/Score[:=]?\s?([\d.]+)/i);
              const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
              const gamma = 2.2;
              const maxScore = 0.09;
              const normalized = Math.min(score / maxScore, 1);
              const adjusted = Math.pow(normalized, gamma);
              const multiplier = 1 - adjusted;
              const brightnessBoost = (1 - normalized) * 0.2;
              const boostedMultiplier = Math.min(multiplier + brightnessBoost, 1);
              const r = Math.floor(160 * boostedMultiplier);
              const g = Math.floor(120 * boostedMultiplier);
              const b = Math.floor(255 * boostedMultiplier);
              polygon.attr("fill", `rgb(${r}, ${g}, ${b})`).style("fill", `rgb(${r}, ${g}, ${b})`);
            }
          });

          const node = svg.select(`#${match}`);
          node.attr("opacity", 1);
          node.selectAll("polygon").attr("fill", "red").style("fill", "red");

          console.log(`🔴 새로운 탐지: ${newTID} → 노드 ${match} 강조`);

          const nextTTPList = highlightNextCandidates(match);
          setNextTTPs(nextTTPList);
          setLatestTID(newTID);

          const svgNode = svg.node() as SVGSVGElement | null;
          const matchedNode = node.node() as SVGGElement | null;

          if (svgNode && matchedNode && zoomRef.current) {
            const nodeBox = matchedNode.getBBox();
            const centerX = nodeBox.x + nodeBox.width / 2;
            const centerY = nodeBox.y + nodeBox.height / 2;

            const vb = svgNode.viewBox.baseVal;
            const viewportWidth = vb.width || 800;
            const viewportHeight = vb.height || 600;
            const step = currentActiveNodesRef.current.length - 3;

            let scale = 3.5;
            if (step === 1) scale = 2.0;
            else if (step === 2) scale = 4.5;
            else if (step === 3) scale = 9;
            else if (step >= 4) scale = 16;

            const translateX = viewportWidth / 2 - centerX * scale;
            const translateY = viewportHeight / 2 - centerY * scale;

            const svgSelection = svg as unknown as d3.Selection<SVGSVGElement, unknown, null, undefined>;
            svgSelection
              .transition()
              .duration(750)
              .call(
                zoomRef.current.transform,
                d3.zoomIdentity.translate(translateX, translateY).scale(scale)
              );
          }
        }
      } catch (e) {
        console.error("❌ TID fetch 실패", e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleZoom = (direction: "in" | "out") => {
    if (zoomRef.current && svgSelectionRef.current) {
      svgSelectionRef.current.call(
        zoomRef.current.scaleBy,
        direction === "in" ? 1.5 : 0.7
      );
    }
  };

  const handleReset = () => {
    if (zoomRef.current && svgSelectionRef.current && initialTransformRef.current) {
      svgSelectionRef.current.transition().duration(500).call(
        zoomRef.current.transform,
        initialTransformRef.current
      );
    }
  };

  return (
    <div
      style={{
        width: "100%",
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
          position: "relative",
        }}
      >
        {/* 오버레이 TTP 정보 박스 */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            backgroundColor: "rgba(255,255,255,0.9)",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "10px",
            minWidth: "200px",
            zIndex: 10,
            fontSize: "14px",
            boxShadow: "0 0 8px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ marginBottom: "8px" }}>
            <strong>Recently Detected TTP</strong>
            <div
              style={{
                backgroundColor: "red",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: "4px",
                marginTop: "4px",
                textAlign: "center",
              }}
            >
              {latestTID || "N/A"}
            </div>
          </div>
          <div>
            <strong>Next Possible TTP</strong>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                marginTop: "4px",
              }}
            >
              {nextTTPs.map((tid) => (
                <div
                  key={tid}
                  style={{
                    backgroundColor: "orange",
                    color: "#fff",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    textAlign: "center",
                    fontWeight: 500,
                  }}
                >
                  {tid}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 확대/축소/리셋 버튼 */}
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            right: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            zIndex: 20,
          }}
        >
          <button onClick={() => handleZoom("in")} style={zoomButtonStyle}>+</button>
          <button onClick={() => handleZoom("out")} style={zoomButtonStyle}>−</button>
          <button onClick={handleReset} style={zoomButtonStyle}>↺</button>
        </div>
      </div>
    </div>
  );
}

const zoomButtonStyle: React.CSSProperties = {
  width: "50px",
  height: "40px",
  fontSize: "16px",
  fontWeight: "bold",
  backgroundColor: "#f0f0f0",
  border: "1px solid #ccc",
  borderRadius: "6px",
  cursor: "pointer",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

