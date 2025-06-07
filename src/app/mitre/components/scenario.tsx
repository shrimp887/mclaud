"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import * as d3 from "d3";

cytoscape.use(dagre);

export default function MitrePage() {
  const cyRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [cy, setCy] = useState<cytoscape.Core | null>(null);
  const [visible, setVisible] = useState(false);

  const path = useMemo(() => ["Initial Access", "Execution", "Discovery", "Lateral Movement", "Collection"], []);

  const allNodes = useMemo(() => [
    "Initial Access", "Execution", "Discovery", "Persistence", "Privilege Escalation",
    "Defense Evasion", "Lateral Movement", "Credential Access", "Impact", "Collection", "Exfiltration",
  ].map((id) => ({ data: { id, status: "off" } })), []);

  const allEdges = useMemo(() => [
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
  ].map(([source, target]) => ({ data: { source, target, id: `${source}-${target}` } })), []);

  const styles = useMemo(() => [
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
  ] as unknown as cytoscape.StylesheetCSS[], []);

  const toSafeId = (id: string) => id.replace(/\s+/g, "-");

  const drawEdgesWithD3 = useCallback((cyInstance: cytoscape.Core) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.append("defs")
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
      path.bezierCurveTo((sPos.x + tPos.x) / 2 + 40, sPos.y, (sPos.x + tPos.x) / 2 - 40, tPos.y, tPos.x - t.renderedWidth() / 2, tPos.y);

      svg.append("path")
        .attr("id", `edge-${toSafeId(id)}`)
        .attr("stroke", "#999")
        .attr("stroke-width", 2)
        .attr("fill", "none")
        .attr("marker-end", "url(#arrow)")
        .attr("d", path.toString());
    });
  }, [allEdges]);

  useEffect(() => {
    if (cyRef.current && !cy) {
      const instance = cytoscape({
        container: cyRef.current,
        elements: [...allNodes, ...allEdges],
        style: styles,
        layout: {
          name: "dagre",
          // @ts-expect-error - cytoscape-dagre plugin uses non-standard rankDir
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
  }, [cy, allEdges, allNodes, styles, drawEdgesWithD3]);

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
      current.animate({ style: { "background-color": "#c8102e", color: "#fff" } }, { duration: 400 });

      current.outgoers("node").forEach((n) => {
        if (n.data("status") === "off") {
          n.data("status", "anticipated");
          n.animate({ style: { "background-color": "#40024D", color: "#fff" } }, { duration: 400 });
        }
      });
      step++;
      setTimeout(proceed, 5000);
    };
    proceed();
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-0">
      <div className="bg-white rounded-xl shadow p-8 w-full">
        <div className="relative w-full">
          <button
            onClick={handleStart}
            className="absolute top-0 left-0 w-[100px] h-[40px] z-10 opacity-0"
          >
            시작
          </button>

          <div className="absolute bottom-5.1 left-5.1 bg-white border text-sm rounded-none shadow-none p-[6px_10px] border-[#888]">
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: "#c8102e" }}></div>
              Detected
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: "#40024D" }}></div>
              Anticipated
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: "#ccc" }}></div>
              Disregarded
            </div>
          </div>

          <div className="relative w-full h-[700px] border border-gray-300 rounded-b-xl overflow-hidden">
            <svg
              ref={svgRef}
              className={`absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
            />
            <div
              ref={cyRef}
              className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 

