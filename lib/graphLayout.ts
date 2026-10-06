import { Graph, layout } from "@dagrejs/dagre";
import type { Concept } from "./types";

/** Layered top-to-bottom layout (foundations first). Returns top-left positions. */
export function layoutConcepts(
  concepts: Concept[],
  size: { width: number; height: number; nodesep?: number; ranksep?: number },
): Map<string, { x: number; y: number }> {
  const g = new Graph();
  g.setGraph({ rankdir: "TB", nodesep: size.nodesep ?? 20, ranksep: size.ranksep ?? 44, marginx: 10, marginy: 10 });
  g.setDefaultEdgeLabel(() => ({}));
  for (const c of concepts) g.setNode(c.id, { width: size.width, height: size.height });
  for (const c of concepts) for (const dep of c.dependsOn) g.setEdge(dep, c.id);
  layout(g);
  const pos = new Map<string, { x: number; y: number }>();
  for (const c of concepts) {
    const n = g.node(c.id);
    pos.set(c.id, { x: n.x - size.width / 2, y: n.y - size.height / 2 });
  }
  return pos;
}
