"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GraphNode {
  id: string;
  type: string;
  label: string;
  parentId?: string;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationType: string;
}

const NODE_COLORS: Record<string, string> = {
  COURSE: "#7c3aed",
  MODULE: "#2563eb",
  LESSON: "#059669",
  PAGE: "#d97706",
};

const EDGE_COLORS: Record<string, string> = {
  PREREQUISITE: "#ef4444",
  RECOMMENDED: "#3b82f6",
  RELATED: "#6b7280",
  UNLOCKS: "#10b981",
};

export default function AdminGraphPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const fetchGraph = useCallback(async () => {
    const res = await fetch("/api/admin/graph");
    if (!res.ok) return;
    const json = await res.json();

    const graphNodes: GraphNode[] = json.data.nodes;
    const graphEdges: GraphEdge[] = json.data.edges;

    // Auto-layout: arrange by type
    const courseNodes = graphNodes.filter((n) => n.type === "COURSE");
    const flowNodes: Node[] = graphNodes.map((n, idx) => {
      const courseIdx = courseNodes.findIndex((c) => c.id === n.id || c.id === n.parentId);
      let x = 0;
      let y = 0;

      if (n.type === "COURSE") {
        x = courseNodes.indexOf(n) * 400;
        y = 0;
      } else if (n.type === "MODULE") {
        const parent = graphNodes.find((p) => p.id === n.parentId);
        const parentIdx = parent ? courseNodes.indexOf(parent) : 0;
        const siblings = graphNodes.filter(
          (s) => s.type === "MODULE" && s.parentId === n.parentId
        );
        x = parentIdx * 400 + siblings.indexOf(n) * 200;
        y = 150;
      } else {
        const parent = graphNodes.find((p) => p.id === n.parentId);
        const siblings = graphNodes.filter(
          (s) => s.type === "LESSON" && s.parentId === n.parentId
        );
        const parentOfParent = parent
          ? graphNodes.find((p) => p.id === parent.parentId)
          : null;
        const grandParentIdx = parentOfParent
          ? courseNodes.indexOf(parentOfParent)
          : 0;
        const moduleIdx = parent
          ? graphNodes
              .filter((s) => s.type === "MODULE" && s.parentId === parent.parentId)
              .indexOf(parent)
          : 0;
        x = grandParentIdx * 400 + moduleIdx * 200 + siblings.indexOf(n) * 150;
        y = 300;
      }

      return {
        id: n.id,
        data: { label: n.label },
        position: { x, y },
        style: {
          background: NODE_COLORS[n.type] || "#6b7280",
          color: "#fff",
          borderRadius: "8px",
          padding: "8px 16px",
          fontSize: "12px",
          fontWeight: 600,
          border: "none",
        },
      };
    });

    const flowEdges: Edge[] = graphEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.relationType,
      style: { stroke: EDGE_COLORS[e.relationType] || "#6b7280" },
      animated: e.relationType === "PREREQUISITE",
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Граф связей контента</h1>
        <div className="flex gap-2">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <Badge key={type} style={{ backgroundColor: color, color: "#fff" }}>
              {type}
            </Badge>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div style={{ height: "600px" }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex gap-2">
        {Object.entries(EDGE_COLORS).map(([type, color]) => (
          <Badge key={type} variant="outline" style={{ borderColor: color, color }}>
            {type}
          </Badge>
        ))}
      </div>
    </div>
  );
}
