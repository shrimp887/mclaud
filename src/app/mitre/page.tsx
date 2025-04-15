"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";

cytoscape.use(dagre);

/* Y축 데이터 */
const attacks = [
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Defense Evasion",
  "Credential Access",
  "Discovery",
  "Lateral Movement",
  "Collection",
  "Exfiltration",
  "Impact",
];
/* X축 데이터 */
const baseTime = new Date("2025-04-15T20:15:20");
const timeLabels = Array.from({ length: 10 }, (_, i) => {
  const t = new Date(baseTime.getTime() + i * 2000); // 5초 간격
  const hh = String(t.getHours()).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  const ss = String(t.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;  // "20:15:20" 형식으로 출력
});



const severityColor = {
  Usual: "#4FC3F7",
  Low: "#FFEB3B",
  Medium: "#FF9800",
  High: "#F44336",
};

/* 원 값들 랜덤 생성 */
const fakeData = Array.from({ length: 10 }, (_, i) =>
  attacks.flatMap((attack, idx) => {
    const shouldInclude = Math.random() > 0.7;
    if (!shouldInclude) return [];
    return {
      service: attack,
      time: i,
      severity: Object.keys(severityColor)[Math.floor(Math.random() * 4)],
      size: Math.random() * 20 + 10,
      y: idx * 60 + 30,
      x: 800 + i * 100,
    };
  })
).flat();


export default function MitrePage() {
  const cyRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
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

  /* 원이랑 시간 왼쪽으로 이동 */
  useEffect(() => {
    let lastTime = performance.now();
    const speed = 50; // px per second
  
    const animate = (now: number) => {
      const deltaTime = (now - lastTime) / 1000; // 초 단위
      lastTime = now;
  
      const dx = deltaTime * speed;
      const svg = svgRef.current;
      if (!svg) return;
  
      // Move circles
      const circles = svg.querySelectorAll("circle");
      circles.forEach((circle) => {
        const cx = parseFloat(circle.getAttribute("cx") || "0");
        circle.setAttribute("cx", (cx - dx).toString());
      });
  
      // Move x-axis time labels
      const texts = svg.querySelectorAll("text[data-type='time']");
      texts.forEach((text) => {
        const t = text as SVGTextElement;
        const x = parseFloat(t.getAttribute("x") || "0");
        t.setAttribute("x", (x - dx).toString());
      });
  
      requestAnimationFrame(animate);
    };
  
    const frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);
  

  useEffect(() => {
    if (cyRef.current && !cy) {
      const tooltip = document.getElementById("tooltip");
      const cyInstance = cytoscape({
        container: cyRef.current,
        elements: { nodes, edges },
        layout: {
          name: "dagre",
          rankDir: "LR",
          rankSep: 100,
          nodeSep: 100,
          spacingFactor: 1.2,
        }as any,
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
          marginBottom: "30px",
        }}
      />
      <div
        className="rounded-xl border border-gray-300 shadow-sm p-2 mb-6 bg-white"
        style={{ overflowX: "auto" }}
      >
        <svg ref={svgRef} width="100%" height={attacks.length * 60 + 40}>
          {/* clipPath 정의 */}
          <defs>
            <clipPath id="clip-both-boundary">
              <rect x="200" y="0" width="calc(100% - 200px)" height="100%" />
            </clipPath>
          </defs>
    
          {/* 줄무늬 배경 추가 */}
          <g>
            {attacks.map((_, i) => (
              <rect
                key={`bg-${i}`}
                x="0"
                y={i * 60}
                width="100%"
                height="60"
                fill={i % 2 === 0 ? "#f9f9f9" : "#ffffff"}
              />
            ))}
          </g>

          {/* 세로 구분선 */}
          <line
            x1={200}
            y1={0}
            x2={200}
            y2={attacks.length * 60}
            stroke="#ccc"
            strokeWidth="1"
          />
          
          {/* 세로축 이름 */}
          {attacks.map((name, i) => (
            <text key={name} x="10" y={i * 60 + 35} fontSize="14">
              {name}
            </text>
          ))}

          {/* 가로축 날짜 */}
          <g>
            {timeLabels.map((label, i) => (
              <text
                key={i}
                data-type="time"
                x={800 + i * 100}
                y={attacks.length * 60 + 20}
                fontSize="12"
                textAnchor="middle"
                fill="#666"
              >
                {label}
              </text>
            ))}
          </g>
    
          {/* clipPath로 감싼 그룹 내부에 circle + text 둘 다 포함 */}
          <g clipPath="url(#clip-both-boundary)">
            {fakeData.map((dot, i) => (
              <circle
                key={`dot-${i}`}
                cx={dot.x}
                cy={dot.y}
                r={dot.size / 2}
                fill={severityColor[dot.severity as keyof typeof severityColor]}
                stroke="#333"
                strokeWidth="0.5"
                style={{ transition: "all 0.3s linear" }}
              />
            ))}

            {timeLabels.map((label, i) => (
              <text
                key={`time-${i}`}
                data-type="time"
                x={800 + i * 100}
                y={attacks.length * 60 + 20}
                fontSize="12"
                textAnchor="middle"
                fill="#666"
              >
                {label}
              </text>
            ))}
          </g>


        </svg>
      </div>
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
  

  function handleStart() {
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
  }
}
