"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";

cytoscape.use(dagre);

export default function MitrePage() {
  const cyRef = useRef<HTMLDivElement>(null);
  const [cy, setCy] = useState<cytoscape.Core | null>(null);

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
    () => [
      {
        data: {
          id: "Initial Access",
          status: "off",
          tactic: "Initial Access",
          technique: "T1078 - Valid Accounts",
          route: "Default Account",
          detectTime: "2025-04-04 12:59 (UTC)",
          capec: "CAPEC-521",
        },
      },
      {
        data: {
          id: "Execution",
          status: "off",
          tactic: "Execution",
          technique: "T1059 - Command and Scripting Interpreter",
          tool: "PowerShell",
          detectTime: "2025-04-04 13:25 (UTC)",
          capec: "CAPEC-242",
        },
      },
      {
        data: {
          id: "Discovery",
          status: "off",
          tactic: "Discovery",
          technique: "T1201 - Password Policy Discovery",
          detectTime: "2025-04-04 13:32 (UTC)",
          capec: "CAPEC-640",
        },
      },
      { data: { id: "Persistence", status: "off" } },
      { data: { id: "Lateral Movement", status: "off" } },
      { data: { id: "Privilege Escalation", status: "off" } },
      { data: { id: "Defense Evasion", status: "off" } },
      { data: { id: "Credential Access", status: "off" } },
      { data: { id: "Collection", status: "off" } },
      { data: { id: "Impact", status: "off" } },
    ],
    []
  );

  const edges = useMemo(
    () => [
      { data: { source: "Initial Access", target: "Execution" } },
      { data: { source: "Execution", target: "Discovery" } },
      { data: { source: "Execution", target: "Persistence" } },
      { data: { source: "Execution", target: "Privilege Escalation" } },
      { data: { source: "Execution", target: "Defense Evasion" } },
      { data: { source: "Discovery", target: "Lateral Movement" } },
      { data: { source: "Lateral Movement", target: "Collection" } },
      { data: { source: "Privilege Escalation", target: "Impact" } },
      { data: { source: "Defense Evasion", target: "Privilege Escalation" } },
      { data: { source: "Persistence", target: "Credential Access" } },
    ],
    []
  );

  const styles = useMemo(
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
      const tooltip = document.getElementById("tooltip");

      const cyInstance = cytoscape({
        container: cyRef.current,
        elements: { nodes, edges },
        layout: {
          name: "dagre",
          // @ts-expect-error: dagre layout에서 rankDir은 정상 속성
          rankDir: "LR",
          rankSep: 100,
          nodeSep: 100,
          spacingFactor: 1.2,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style: styles as any,
      });

      cyInstance.on("mouseover", "node", (event) => {
        const node = event.target;
        const data = node.data();
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

      cyInstance.on("mouseout", "node", () => {
        if (tooltip) tooltip.classList.add("hidden");
      });

      cyInstance.on("mousemove", (e) => {
        if (tooltip) {
          tooltip.style.left = e.originalEvent.pageX + 10 + "px";
          tooltip.style.top = e.originalEvent.pageY + 10 + "px";
        }
      });

      setCy(cyInstance);
    }
  }, [cy, nodes, edges, styles]);

  const handleStart = () => {
    if (!cy) return;

    let delay = 0;

    for (let i = 0; i < detectedPath.length; i++) {
      const id = detectedPath[i];

      setTimeout(() => {
        const node = cy.getElementById(id);
        if (node) node.data("status", "on");

        if (i > 1 && forkSiblings.includes(id)) {
          forkSiblings.forEach((sibling) => {
            if (sibling !== id) {
              const n = cy.getElementById(sibling);
              if (n) {
                const descendants = n.successors();
                cy.remove(descendants);
                cy.remove(n.connectedEdges());
                cy.remove(n);
              }
            }
          });
        }
      }, delay);

      delay += 1000;
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
        }}
      />
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
    </div>
  );
}
