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

  const nodeDetails: Record<
    string,
    {
      tactic: string;
      technique: string;
      tool: string;
      detectTime: string;
      capec: string;
    }
  > = {
    "Initial Access": {
      tactic: "Initial Access",
      technique: "T1190",
      tool: "Web Exploit",
      detectTime: "202x-xx-xx xx:xx (UTC)",
      capec: "CAPEC-137",
    },
    Execution: {
      tactic: "Execution",
      technique: "T1059",
      tool: "Reverse Shell",
      detectTime: "202x-xx-xx xx:xx (UTC)",
      capec: "CAPEC-111",
    },
    Discovery: {
      tactic: "Discovery",
      technique: "T1082 - System Information Discovery",
      tool: "Systeminfo",
      detectTime: "202x-xx-xx xx:xx (UTC)",
      capec: "CAPEC-163",
    },
    "Lateral Movement": {
      tactic: "Lateral Movement",
      technique: "T1021",
      tool: "SSH Client",
      detectTime: "202x-xx-xx xx:xx (UTC)",
      capec: "CAPEC-550",
    },
    Collection: {
      tactic: "Collection",
      technique: "T1005",
      tool: "Cloud CLI",
      detectTime: "202x-xx-xx xx:xx (UTC)",
      capec: "CAPEC-118",
    },
    "Credential Access": {
      tactic: "Credential Access",
      technique: "T1552",
      tool: "Credential Harvesting via Metadata API",
      detectTime: "202x-xx-xx xx:xx (UTC)",
      capec: "CAPEC-640",
    },
    Exfiltration: {
      tactic: "Exfiltration",
      technique: "T1041",
      tool: "Web Transfer",
      detectTime: "202x-xx-xx xx:xx (UTC)",
      capec: "CAPEC-157",
    },

    // ... 계속 추가 가능
  };

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

  // 📌 Tooltip 상태
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

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

      instance.on("tap", "node", (event) => {
        const node = event.target;
        const nodeId = node.id();
        const pos = node.renderedPosition();
        const height = node.renderedHeight();

        // 상태 확인
        if (node.data("status") !== "on") {
          setActiveNode(null);
          setTooltipPosition(null);
          return;
        }

        const cyContainer = cyRef.current?.getBoundingClientRect();
        if (!cyContainer) return;

        if (activeNode === nodeId) {
          setActiveNode(null);
          setTooltipPosition(null);
        } else {
          setActiveNode(nodeId);
          setTooltipPosition({
            x: cyContainer.left + pos.x,
            y: cyContainer.top + pos.y + height / 2 + 10,
          });
        }
      });
    }
  }, [cy, allEdges, allNodes, styles, drawEdgesWithD3]);

  const [visible, setVisible] = useState(false);

  const handleStart = () => {
    if (!cy) return;
    setVisible(true);

    let step = 0;
    const visited = new Set<string>();

    const proceed = () => {
      if (step >= path.length) return;

      const current = cy.getElementById(path[step]);
      visited.add(current.id());

      current.data("status", "on");
      current.animate(
        { style: { "background-color": "#c8102e", color: "#fff" } },
        { duration: 400 }
      );

      current.outgoers("node").forEach((n) => {
        if (n.data("status") === "off") {
          n.data("status", "anticipated");
          n.animate(
            { style: { "background-color": "#40024D", color: "#fff" } },
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

      {activeNode && tooltipPosition && nodeDetails[activeNode] && (
        <div
          className="fixed bg-white border border-gray-400 shadow-md p-3 text-sm"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: "translate(-50%, 0)",
            zIndex: 1000,
            minWidth: "240px",
          }}
        >
          <div>
            <strong>Tactic</strong>: {nodeDetails[activeNode].tactic}
          </div>
          <div>
            <strong>Technique</strong>: {nodeDetails[activeNode].technique}
          </div>
          <div>
            <strong>Tool</strong>: {nodeDetails[activeNode].tool}
          </div>
          <div>
            <strong>Detect Time</strong>: {nodeDetails[activeNode].detectTime}
          </div>
          <div>
            <strong>MITRE CAPEC</strong>: {nodeDetails[activeNode].capec}
          </div>
        </div>
      )}

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
