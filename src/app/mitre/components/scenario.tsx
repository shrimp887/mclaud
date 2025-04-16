"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { CytoscapeStyle } from "@/types/cytoscape-style";

cytoscape.use(dagre);

export default function MitrePage() {
  const cyRef = useRef<HTMLDivElement>(null);
  const [cy, setCy] = useState<cytoscape.Core | null>(null);
  const [showGraph, setShowGraph] = useState(false);

  const forkSiblings = useMemo(
    () => [
      "Discovery",
      "Persistence",
      "Privilege Escalation",
      "Defense Evasion",
    ],
    []
  );

  const detectedPath = useMemo(
    () => ["Initial Access", "Execution", "Discovery", "Lateral Movement"],
    []
  );

  const nodes = useMemo(
    () =>
      [
        {
          id: "Initial Access",
          tactic: "Initial Access",
          technique: "T1078",
          detectTime: "2025-04-04 12:59 (UTC)",
          capec: "CAPEC-521",
          route: "Default Account",
        },
        {
          id: "Execution",
          tactic: "Execution",
          technique: "T1059",
          detectTime: "2025-04-04 13:25 (UTC)",
          capec: "CAPEC-242",
          tool: "PowerShell",
        },
        {
          id: "Discovery",
          tactic: "Discovery",
          technique: "T1201",
          detectTime: "2025-04-04 13:32 (UTC)",
          capec: "CAPEC-640",
        },
        { id: "Persistence" },
        { id: "Privilege Escalation" },
        { id: "Defense Evasion" },
        { id: "Lateral Movement" },
        { id: "Credential Access" },
        { id: "Impact" },
        { id: "Collection" },
      ].map((d) => ({ data: { ...d, status: "off" } })),
    []
  );

  const edges = useMemo(
    () =>
      [
        { source: "Initial Access", target: "Execution" },
        { source: "Execution", target: "Discovery" },
        { source: "Execution", target: "Persistence" },
        { source: "Execution", target: "Privilege Escalation" },
        { source: "Execution", target: "Defense Evasion" },
        { source: "Discovery", target: "Lateral Movement" },
        { source: "Lateral Movement", target: "Collection" },
        { source: "Persistence", target: "Credential Access" },
        { source: "Defense Evasion", target: "Privilege Escalation" },
        { source: "Privilege Escalation", target: "Impact" },
      ].map((e) => ({ data: e })),
    []
  );

  const styles: CytoscapeStyle[] = useMemo(
    () => [
      {
        selector: "node",
        style: {
          label: "data(id)",
          width: 160,
          height: 60,
          shape: "roundrectangle",
          "text-valign": "center",
          "text-halign": "center",
          "font-size": 14,
          "background-color": "#ddd",
          color: "#333",
          "text-wrap": "wrap",
          "text-max-width": "140px",
        },
      },
      {
        selector: 'node[status = "on"]',
        style: {
          "background-color": "#c8102e",
          color: "#fff",
          "font-weight": "bold",
        },
      },
      {
        selector: 'node[status = "anticipated"]',
        style: {
          "background-color": "#40024D",
          color: "#fff",
        },
      },
      {
        selector: "edge",
        style: {
          width: 2,
          "line-color": "#999",
          "target-arrow-shape": "triangle",
          "target-arrow-color": "#999",
          "curve-style": "straight",
        },
      },
    ],
    []
  );

  useEffect(() => {
    if (cyRef.current && !cy) {
      const cyInstance = cytoscape({
        container: cyRef.current,
        elements: { nodes, edges },
        layout: {
          name: "dagre",
          // @ts-expect-error: rankDir is used by cytoscape-dagre plugin
          rankDir: "LR",
          rankSep: 100,
          nodeSep: 100,
          spacingFactor: 1.2,
        },
        style: styles,
        userZoomingEnabled: false,
        userPanningEnabled: false,
        boxSelectionEnabled: false,
        autoungrabify: true,
      });

      cyInstance.on("mouseover", "node", (e) => {
        const tooltip = document.getElementById("tooltip");
        const data = e.target.data();
        if (tooltip) {
          tooltip.innerHTML = `
            <strong>Tactic:</strong> ${data.tactic || "-"}<br/>
            <strong>Technique:</strong> ${data.technique || "-"}<br/>
            ${data.route ? `<strong>Route:</strong> ${data.route}<br/>` : ""}
            ${data.tool ? `<strong>Tool:</strong> ${data.tool}<br/>` : ""}
            <strong>Detect Time:</strong> ${data.detectTime || "-"}<br/>
            <strong>MITRE CAPEC:</strong> ${data.capec || "-"}
          `;
          tooltip.classList.remove("hidden");
        }
      });

      cyInstance.on("mouseout", () => {
        const tooltip = document.getElementById("tooltip");
        if (tooltip) tooltip.classList.add("hidden");
      });

      cyInstance.on("mousemove", (e) => {
        const tooltip = document.getElementById("tooltip");
        if (tooltip) {
          tooltip.style.left = e.originalEvent.pageX + 10 + "px";
          tooltip.style.top = e.originalEvent.pageY - 10 + "px";
        }
      });

      setCy(cyInstance);
    }
  }, [cy, nodes, edges, styles]);

  const handleStart = () => {
    if (!cy) return;
    let delay = 0;

    for (let i = 0; i < detectedPath.length; i++) {
      const currentId = detectedPath[i];

      setTimeout(() => {
        const current = cy.getElementById(currentId);
        if (current) current.data("status", "on");

        if (i === 0) setShowGraph(true);

        const successors = current?.outgoers("node");
        successors.forEach((s) => {
          if (s.data("status") === "off") {
            s.data("status", "anticipated");
          }
        });

        if (i > 1 && forkSiblings.includes(currentId)) {
          forkSiblings.forEach((sibling) => {
            if (sibling !== currentId) {
              const target = cy.getElementById(sibling);
              if (target) {
                const descendants = target.successors();
                target.animate(
                  {
                    position: {
                      x: target.position("x") + (Math.random() * 200 - 100),
                      y: target.position("y") + (Math.random() * 200 - 100),
                    },
                    style: {
                      width: 1,
                      height: 1,
                      opacity: 0,
                      "background-opacity": 0,
                      "border-opacity": 0,
                      "text-opacity": 0,
                    },
                  },
                  {
                    duration: 700,
                    complete: () => {
                      cy.remove(descendants);
                      cy.remove(target.connectedEdges());
                      cy.remove(target);
                    },
                  }
                );
              }
            }
          });
        }
      }, delay);

      delay += 5000;
    }
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
        ref={cyRef}
        style={{
          width: "100%",
          height: "700px",
          border: "1px solid #ddd",
          marginBottom: "20px",
          opacity: showGraph ? 1 : 0,
          transition: "opacity 1s ease-in-out",
          pointerEvents: showGraph ? "auto" : "none",
        }}
      />

      {/* 툴팁 */}
      <div
        id="tooltip"
        className="hidden"
        style={{
          position: "absolute",
          zIndex: 1000,
          padding: "8px 12px",
          background: "white",
          border: "1px solid #ccc",
          fontSize: "13px",
          lineHeight: "1.4",
          boxShadow: "2px 2px 8px rgba(0, 0, 0, 0.15)",
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      />

      {/* 범례 */}
      {showGraph && (
        <div className="absolute left-6 bottom-6 space-y-2 text-sm bg-white p-2 rounded shadow border">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#c8102e]" />
            <span>Detected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#40024D]" />
            <span>Anticipated</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-[#ddd]" />
            <span>Disregarded</span>
          </div>
        </div>
      )}
    </div>
  );
}
