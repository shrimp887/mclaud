"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import * as d3 from "d3";

cytoscape.use(dagre);

export default function MitrePage() {
  const cyRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [cy, setCy] = useState<cytoscape.Core | null>(null);

  const path = useMemo(
    () => [
      "Initial Access",
      "Execution",
      "Discovery",
      "Lateral Movement",
      "Collection",
    ],
    []
  );

  const allNodes = useMemo(
    () =>
      [
        "Initial Access",
        "Execution",
        "Discovery",
        "Persistence",
        "Privilege Escalation",
        "Defense Evasion",
        "Lateral Movement",
        "Credential Access",
        "Impact",
        "Collection",
        "Exfiltration",
      ].map((id) => ({ data: { id, status: "off" } })),
    []
  );

  const allEdges = useMemo(
    () =>
      [
        ["Initial Access", "Execution"],
        ["Execution", "Discovery"],
        ["Execution", "Persistence"],
        ["Execution", "Privilege Escalation"],
        ["Execution", "Defense Evasion"],
        ["Discovery", "Lateral Movement"],
        ["Discovery", "Persistence"],
        ["Lateral Movement", "Collection"],
        ["Collection", "Credential Access"],
        ["Credential Access", "Exfiltration"],
        ["Privilege Escalation", "Impact"],
        ["Defense Evasion", "Privilege Escalation"],
      ].map(([source, target]) => ({
        data: { source, target, id: `${source}-${target}` },
      })),
    []
  );

  const styles = useMemo(
    () => [
      {
        selector: "node",
        style: {
          label: "data(id)",
          width: 160,
          height: 80,
          shape: "roundrectangle",
          "text-valign": "center",
          "text-halign": "center",
          "font-size": 18,
          "background-color": "#e0e0e0",
          "border-width": 2,
          "border-color": "#aaa",
          color: "#333",
          "text-wrap": "wrap",
        },
      },
      {
        selector: "edge",
        style: { display: "none" },
      },
    ],
    []
  );

  const toSafeId = (id: string) => id.replace(/\s+/g, "-");

  const drawEdgesWithD3 = (cyInstance: cytoscape.Core) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    allEdges.forEach(({ data: { source, target, id } }) => {
      const s = cyInstance.getElementById(source);
      const t = cyInstance.getElementById(target);
      if (!s || !t) return;

      const sPos = s.renderedPosition();
      const tPos = t.renderedPosition();
      const path = d3.path();
      path.moveTo(sPos.x + s.renderedWidth() / 2, sPos.y);
      path.bezierCurveTo(
        (sPos.x + tPos.x) / 2 + 40,
        sPos.y,
        (sPos.x + tPos.x) / 2 - 40,
        tPos.y,
        tPos.x - t.renderedWidth() / 2,
        tPos.y
      );

      svg
        .append("path")
        .attr("id", `edge-${toSafeId(id)}`)
        .attr("stroke", "#999")
        .attr("stroke-width", 2)
        .attr("fill", "none")
        .attr("marker-end", "url(#arrow)")
        .attr("d", path.toString());
    });
  };

  useEffect(() => {
    if (cyRef.current && !cy) {
      const instance = cytoscape({
        container: cyRef.current,
        elements: [...allNodes, ...allEdges],
        style: styles as unknown as cytoscape.StylesheetCSS[],
        layout: {
          name: "dagre",
          // @ts-expect-error: rankDir is used by cytoscape-dagre plugin
          rankDir: "LR",
          nodeSep: 100,
          rankSep: 120,
        },
        userZoomingEnabled: false,
        userPanningEnabled: false,
        boxSelectionEnabled: false,
        autoungrabify: true,
      });

      setCy(instance);
      instance.ready(() => drawEdgesWithD3(instance));
    }
  }, [cy, allEdges, allNodes, drawEdgesWithD3, styles]);

  // 1. 상태 추가
  const [visible, setVisible] = useState(false);

  // 2. handleStart 안에 추가
  const handleStart = () => {
    if (!cy) return;
    setVisible(true); // 👉 시작하면 노출

    let step = 0;
    const visited = new Set<string>();

    const proceed = () => {
      if (step >= path.length) return;

      const current = cy.getElementById(path[step]);
      visited.add(current.id());

      current.animate(
        {
          style: { "background-color": "#c8102e", color: "#fff" },
        },
        { duration: 400 }
      );

      current.outgoers("node").forEach((n) => {
        if (n.data("status") === "off") {
          n.data("status", "anticipated");
          n.animate(
            {
              style: { "background-color": "#40024D", color: "#fff" },
            },
            { duration: 400 }
          );
        }
      });

      if (step > 0) {
        const prev = cy.getElementById(path[step - 1]);
        prev.outgoers("node").forEach((n) => {
          const isAnticipated = n.data("status") === "anticipated";
          const isConnected = n.edgesWith(current).length > 0;
          if (isAnticipated && !isConnected && !visited.has(n.id())) {
            const successors = n.successors().filter((s) => s.isNode());
            const connectedEdges = n.connectedEdges();

            connectedEdges.forEach((e) => {
              const safeId = toSafeId(e.id());
              d3.select(`#edge-${safeId}`).remove();
              cy.remove(e);
            });

            successors.forEach((child) => {
              child.animate(
                {
                  position: {
                    x: child.position("x") + (Math.random() * 100 - 50),
                    y: child.position("y") + (Math.random() * 100 - 50),
                  },
                  style: { width: 1, height: 1, opacity: 0 },
                },
                {
                  duration: 600,
                  complete: () => {
                    cy.remove(child);
                  },
                }
              );
            });

            n.animate(
              {
                position: {
                  x: n.position("x") + (Math.random() * 100 - 50),
                  y: n.position("y") + (Math.random() * 100 - 50),
                },
                style: { width: 1, height: 1, opacity: 0 },
              },
              {
                duration: 600,
                complete: () => {
                  cy.remove(n);
                },
              }
            );
          }
        });

        prev.outgoers("edge").forEach((e) => {
          const target = e.target();
          if (!visited.has(target.id()) && target.id() !== current.id()) {
            const safeId = toSafeId(e.id());
            d3.select(`#edge-${safeId}`).remove();
            cy.remove(e);
          }
        });
      }

      step++;
      setTimeout(proceed, 1000);
    };

    proceed();
  };

  return (
    <div className="p-6 relative">
      <h2 className="text-2xl font-bold mb-4">MITRE ATT&CK 탐지 시나리오</h2>
      <button
        onClick={handleStart}
        className="mb-4 px-4 py-2 bg-red-600 text-white rounded"
      >
        시작
      </button>
      <div
        className="absolute bottom-5.1 left-5.1 bg-white border text-sm"
        style={{
          borderRadius: 0,
          padding: "6px 10px",
          borderColor: "#888",
          margin: 0,
          boxShadow: "none",
        }}
      >
        <div className="flex items-center mb-1">
          <div
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: "#c8102e" }}
          ></div>
          Detected
        </div>
        <div className="flex items-center mb-1">
          <div
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: "#40024D" }}
          ></div>
          Anticipated
        </div>
        <div className="flex items-center">
          <div
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: "#ccc" }}
          ></div>
          Disregarded
        </div>
      </div>
      <div className="relative w-full h-[700px] border border-gray-300">
        <svg
          ref={svgRef}
          className={`absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-700 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          ref={cyRef}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </div>
  );
}
