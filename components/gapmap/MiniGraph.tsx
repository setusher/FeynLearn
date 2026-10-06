"use client";

import "@xyflow/react/dist/base.css";
import { Handle, Position, ReactFlow, ReactFlowProvider, type Edge, type Node, type NodeProps } from "@xyflow/react";
import { useMemo } from "react";
import { STATUS_VAR } from "@/components/ui/Chip";
import { layoutConcepts } from "@/lib/graphLayout";
import type { Concept, ConceptStatus } from "@/lib/types";

// Non-interactive miniature of a concept graph for the dashboard Gap map box.

const W = 150;
const H = 34;

type MiniData = { label: string; status: ConceptStatus };
type MiniNode = Node<MiniData, "mini">;

const hidden = "!h-1 !w-1 !min-w-0 !border-0 !bg-transparent";

function MiniConcept({ data }: NodeProps<MiniNode>) {
  return (
    <div className="flex h-[34px] w-[150px] items-center gap-1.5 rounded-[8px] border border-line bg-card-2 px-2">
      <Handle type="target" position={Position.Top} className={hidden} />
      <span aria-hidden className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: STATUS_VAR[data.status] }} />
      <span className="truncate text-[10px] font-semibold text-text">{data.label}</span>
      <Handle type="source" position={Position.Bottom} className={hidden} />
    </div>
  );
}

const nodeTypes = { mini: MiniConcept };

export default function MiniGraph({ concepts, label }: { concepts: Concept[]; label: string }) {
  const { nodes, edges } = useMemo(() => {
    const pos = layoutConcepts(concepts, { width: W, height: H, nodesep: 12, ranksep: 26 });
    const nodes: MiniNode[] = concepts.map((c) => ({
      id: c.id,
      type: "mini",
      position: pos.get(c.id) ?? { x: 0, y: 0 },
      data: { label: c.label, status: c.status },
    }));
    const edges: Edge[] = concepts.flatMap((c) =>
      c.dependsOn.map((d) => ({
        id: `${d}->${c.id}`,
        source: d,
        target: c.id,
        type: "smoothstep",
        style: { stroke: "var(--text-3)", strokeWidth: 1 },
      })),
    );
    return { nodes, edges };
  }, [concepts]);

  return (
    <div role="img" aria-label={label} className="h-full w-full">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.06 }}
          minZoom={0.2}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        />
      </ReactFlowProvider>
    </div>
  );
}
