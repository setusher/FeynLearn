"use client";

import "@xyflow/react/dist/base.css";
import {
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { useEffect, useMemo } from "react";
import { STATUS_LABEL } from "@/lib/graph";
import { layoutConcepts } from "@/lib/graphLayout";
import type { Concept, ConceptStatus } from "@/lib/types";

const NODE_W = 230;
const NODE_H = 76;

export const STATUS_COLOR: Record<ConceptStatus, string> = {
  solid: "var(--status-solid)",
  shaky: "var(--status-shaky)",
  missing: "var(--status-missing)",
};

type ConceptNodeData = {
  label: string;
  status: ConceptStatus;
  change?: string;
  selected: boolean;
};
type ConceptNodeType = Node<ConceptNodeData, "concept">;

function ConceptNode({ data }: NodeProps<ConceptNodeType>) {
  return (
    <div
      className={`flex h-[76px] w-[230px] cursor-pointer flex-col justify-center gap-1 rounded-sm border bg-surface px-3 text-left transition-colors duration-150 ${
        data.selected ? "border-accent outline-2 outline-accent" : "border-line hover:border-ink-2"
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-1 !w-1 !min-w-0 !border-0 !bg-transparent" />
      <p className="line-clamp-2 text-[13px] leading-snug text-ink">{data.label}</p>
      <p className="flex items-center gap-1.5 text-xs text-ink-2">
        <span aria-hidden className="inline-block h-2.5 w-2.5" style={{ background: STATUS_COLOR[data.status] }} />
        <span className="font-medium text-ink">{STATUS_LABEL[data.status]}</span>
        {data.change && <span>{data.change}</span>}
      </p>
      <Handle type="source" position={Position.Bottom} className="!h-1 !w-1 !min-w-0 !border-0 !bg-transparent" />
    </div>
  );
}

const nodeTypes = { concept: ConceptNode };

function layoutGraph(concepts: Concept[]) {
  return layoutConcepts(concepts, { width: NODE_W, height: NODE_H });
}

type Props = {
  concepts: Concept[];
  changes: Record<string, string | undefined>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

function Inner({ concepts, changes, selectedId, onSelect }: Props) {
  const flow = useReactFlow();
  const positions = useMemo(() => layoutGraph(concepts), [concepts]);

  const nodes: ConceptNodeType[] = concepts.map((c) => ({
    id: c.id,
    type: "concept",
    position: positions.get(c.id) ?? { x: 0, y: 0 },
    data: { label: c.label, status: c.status, change: changes[c.id], selected: c.id === selectedId },
    ariaLabel: `${c.label}. ${STATUS_LABEL[c.status]}${changes[c.id] ? `, ${changes[c.id]}` : ""}`,
  }));

  const edges: Edge[] = concepts.flatMap((c) =>
    c.dependsOn.map((dep) => ({
      id: `${dep}->${c.id}`,
      source: dep,
      target: c.id,
      type: "smoothstep",
      style: { stroke: "var(--ink-2)", strokeWidth: 1 },
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "#9A9A9F" },
    })),
  );

  const ids = concepts.map((c) => c.id).join("|");
  useEffect(() => {
    const t = window.setTimeout(() => void flow.fitView({ padding: 0.08, maxZoom: 1 }), 0);
    return () => window.clearTimeout(t);
  }, [flow, ids]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm text-ink-2">
        <p>Arrows point from a foundation down to the ideas that build on it.</p>
        <div className="flex shrink-0 rounded-sm border border-line bg-surface">
          <button type="button" className="h-8 w-8 hover:bg-bg" onClick={() => void flow.zoomIn()} aria-label="Zoom in">+</button>
          <button type="button" className="h-8 w-8 border-l border-line hover:bg-bg" onClick={() => void flow.zoomOut()} aria-label="Zoom out">-</button>
          <button type="button" className="h-8 border-l border-line px-2 hover:bg-bg" onClick={() => void flow.fitView({ padding: 0.08, maxZoom: 1 })}>Fit</button>
        </div>
      </div>
      <div className="h-[380px] rounded-sm border sm:h-[500px] border-line bg-surface">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => onSelect(node.id)}
          onPaneClick={() => onSelect(null)}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          zoomOnScroll={false}
          panOnScroll={false}
          preventScrolling={false}
          minZoom={0.25}
          maxZoom={1.6}
          fitView
          fitViewOptions={{ padding: 0.08, maxZoom: 1 }}
        />
      </div>
    </div>
  );
}

export default function ConceptGraph(props: Props) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  );
}
