import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, ZoomIn, ZoomOut, Maximize2, Network, Loader2 } from "lucide-react";
import { apiUrl } from "../lib/api";
import type { MindMapNode, MindMapItem } from "../hooks/useMindMaps";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LayoutNode {
  id: string;
  label: string;
  x: number;
  y: number;
  depth: number;
  parent: string | null;
  children: string[];
}

interface Camera {
  x: number;
  y: number;
  zoom: number;
}

// ─── Color palette by depth ────────────────────────────────────────────────

const DEPTH_COLORS = [
  { fill: "#4f46e5", text: "#ffffff", stroke: "#3730a3" }, // root — indigo
  { fill: "#7c3aed", text: "#ffffff", stroke: "#5b21b6" }, // L1 — violet
  { fill: "#0891b2", text: "#ffffff", stroke: "#0e7490" }, // L2 — cyan
  { fill: "#059669", text: "#ffffff", stroke: "#047857" }, // L3 — emerald
];
const LEAF_COLOR = { fill: "#f1f5f9", text: "#334155", stroke: "#cbd5e1" };

function getColor(depth: number, isSelected: boolean) {
  const base = DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)] || LEAF_COLOR;
  if (isSelected) return { ...base, stroke: "#f59e0b", strokeWidth: 3 };
  return { ...base, strokeWidth: depth === 0 ? 2.5 : 1.5 };
}

// ─── Layout algorithm ─────────────────────────────────────────────────────────

function buildLayout(root: MindMapNode): Map<string, LayoutNode> {
  const nodes = new Map<string, LayoutNode>();
  let idCounter = 0;

  const assign = (
    node: MindMapNode,
    depth: number,
    parentId: string | null,
    angle: number,
    spread: number,
    radius: number
  ): string => {
    const id = `n${idCounter++}`;
    const x = depth === 0 ? 0 : Math.cos(angle) * radius;
    const y = depth === 0 ? 0 : Math.sin(angle) * radius;

    const layoutNode: LayoutNode = {
      id,
      label: node.label || "",
      x,
      y,
      depth,
      parent: parentId,
      children: [],
    };
    nodes.set(id, layoutNode);

    if (parentId) {
      nodes.get(parentId)!.children.push(id);
    }

    const children = node.children || [];
    const childCount = children.length;
    if (childCount > 0) {
      const childRadius = radius + (depth === 0 ? 200 : depth === 1 ? 170 : 130);
      const halfSpread = childCount === 1 ? 0 : spread / 2;
      const step = childCount === 1 ? 0 : spread / (childCount - 1);
      const startAngle = angle - halfSpread;

      children.forEach((child, i) => {
        const childAngle = childCount === 1 ? angle : startAngle + step * i;
        const childSpread = Math.max(spread / childCount, 0.5);
        assign(child, depth + 1, id, childAngle, childSpread, childRadius);
      });
    }

    return id;
  };

  const rootCount = root.children?.length || 0;
  assign(root, 0, null, 0, Math.PI * 2, 0);

  return nodes;
}

// ─── Canvas renderer ──────────────────────────────────────────────────────────

const FONT = "14px 'Geist Variable', 'Inter', sans-serif";
const FONT_ROOT = "bold 16px 'Geist Variable', 'Inter', sans-serif";
const CORNER_R = 12;
const PAD_X = 16;
const PAD_Y = 10;
const MIN_W = 80;

function measureLabel(ctx: CanvasRenderingContext2D, label: string, depth: number) {
  ctx.font = depth === 0 ? FONT_ROOT : FONT;
  const w = Math.max(ctx.measureText(label).width + PAD_X * 2, MIN_W);
  const h = (depth === 0 ? 20 : 16) + PAD_Y * 2;
  return { w, h };
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawEdge(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string
) {
  const mx = (x1 + x2) / 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(mx, y1, mx, y2, x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MindMap() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [mindMap, setMindMap] = useState<MindMapItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [layout, setLayout] = useState<Map<string, LayoutNode>>(new Map());

  // ── Fetch mind map data ──
  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("jwt_token");
    setLoading(true);
    fetch(apiUrl(`/api/materials/mindmaps/${id}/`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Mind map not found");
        return r.json();
      })
      .then((data: MindMapItem) => {
        setMindMap(data);
        const nodes = buildLayout(data.data);
        setLayout(nodes);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Center camera when layout is ready ──
  useEffect(() => {
    if (layout.size === 0 || !containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    setCamera({ x: width / 2, y: height / 2, zoom: 1 });
  }, [layout]);

  // ── Collect subtree IDs ──
  const getSubtree = useCallback(
    (nodeId: string): Set<string> => {
      const result = new Set<string>();
      const dfs = (id: string) => {
        result.add(id);
        layout.get(id)?.children.forEach(dfs);
      };
      dfs(nodeId);
      return result;
    },
    [layout]
  );

  // ── Draw ──
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || layout.size === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, width, height);

    // Subtle grid
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 0.5;
    const gridSize = 40 * camera.zoom;
    const offsetX = camera.x % gridSize;
    const offsetY = camera.y % gridSize;
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    const highlighted = selectedId ? getSubtree(selectedId) : null;

    // Pre-measure labels
    const dims = new Map<string, { w: number; h: number }>();
    layout.forEach((node, nodeId) => {
      dims.set(nodeId, measureLabel(ctx, node.label, node.depth));
    });

    // Draw edges first
    layout.forEach((node, nodeId) => {
      const parentNode = node.parent ? layout.get(node.parent) : null;
      if (!parentNode) return;
      const { w: pw, h: ph } = dims.get(node.parent!)!;
      const { w: cw, h: ch } = dims.get(nodeId)!;
      const isHighlighted = highlighted ? highlighted.has(nodeId) : true;

      const edgeColor = isHighlighted ? "#94a3b8" : "#e2e8f0";
      const x1 = parentNode.x + pw / 2;
      const y1 = parentNode.y;
      const x2 = node.x - cw / 2;
      const y2 = node.y;

      ctx.globalAlpha = isHighlighted ? 1 : 0.25;
      drawEdge(ctx, x1, y1, x2, y2, edgeColor);
      ctx.globalAlpha = 1;
    });

    // Draw nodes
    layout.forEach((node, nodeId) => {
      const { w, h } = dims.get(nodeId)!;
      const x = node.x - w / 2;
      const y = node.y - h / 2;
      const isSelected = nodeId === selectedId;
      const isHighlighted = highlighted ? highlighted.has(nodeId) : true;

      ctx.globalAlpha = isHighlighted ? 1 : 0.2;

      const { fill, text, stroke, strokeWidth } = getColor(node.depth, isSelected);

      // Node shadow
      if (isHighlighted) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.12)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;
      }

      drawRoundRect(ctx, x, y, w, h, CORNER_R);
      ctx.fillStyle = fill;
      ctx.fill();

      if (isHighlighted) ctx.restore();

      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeWidth;
      drawRoundRect(ctx, x, y, w, h, CORNER_R);
      ctx.stroke();

      // Selected ring
      if (isSelected) {
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 3;
        drawRoundRect(ctx, x - 3, y - 3, w + 6, h + 6, CORNER_R + 2);
        ctx.stroke();
      }

      // Label
      ctx.font = node.depth === 0 ? FONT_ROOT : FONT;
      ctx.fillStyle = text;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.label, node.x, node.y);
      ctx.globalAlpha = 1;
    });

    ctx.restore();
  }, [layout, camera, selectedId, getSubtree]);

  // ── Resize canvas to fill container ──
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ro = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    });
    ro.observe(container);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    return () => ro.disconnect();
  }, [draw]);

  useEffect(() => { draw(); }, [draw]);

  // ── Pan ──
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setCamera((c) => ({ ...c, x: c.x + dx, y: c.y + dy }));
  };
  const onMouseUp = () => { dragging.current = false; };

  // ── Zoom (scroll) ──
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setCamera((c) => {
      const newZoom = Math.min(Math.max(c.zoom * factor, 0.2), 4);
      return { ...c, zoom: newZoom };
    });
  };

  // ── Click → select node ──
  const onClick = (e: React.MouseEvent) => {
    if (!canvasRef.current || layout.size === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left - camera.x) / camera.zoom;
    const cy = (e.clientY - rect.top - camera.y) / camera.zoom;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    let hit: string | null = null;
    layout.forEach((node, nodeId) => {
      const { w, h } = measureLabel(ctx, node.label, node.depth);
      const x = node.x - w / 2;
      const y = node.y - h / 2;
      if (cx >= x && cx <= x + w && cy >= y && cy <= y + h) {
        hit = nodeId;
      }
    });
    setSelectedId(hit === selectedId ? null : hit);
  };

  // ── Controls ──
  const zoomIn = () => setCamera((c) => ({ ...c, zoom: Math.min(c.zoom * 1.2, 4) }));
  const zoomOut = () => setCamera((c) => ({ ...c, zoom: Math.max(c.zoom / 1.2, 0.2) }));
  const resetView = () => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    setCamera({ x: width / 2, y: height / 2, zoom: 1 });
    setSelectedId(null);
  };

  // ── Export PNG ──
  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `mindmap-${id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // ── Touch support ──
  const lastTouch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && lastTouch.current) {
      const dx = e.touches[0].clientX - lastTouch.current.x;
      const dy = e.touches[0].clientY - lastTouch.current.y;
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setCamera((c) => ({ ...c, x: c.x + dx, y: c.y + dy }));
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px] text-indigo-600">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading mind map…</p>
        </div>
      </div>
    );
  }

  if (error || !mindMap) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4">
          <Network size={48} className="text-slate-300 mx-auto" />
          <p className="text-slate-500 dark:text-slate-400">{error || "Mind map not found."}</p>
          <button
            onClick={() => navigate("/mindmaps")}
            className="text-sm text-indigo-600 underline"
          >
            Back to Mind Maps
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/mindmaps")}
            className="p-2 rounded-xl hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 transition-colors text-slate-500 dark:text-slate-400"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
              {mindMap.title}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400">
              Click a node to highlight its subtree · Scroll to zoom · Drag to pan
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 w-12 text-center">
            {Math.round(camera.zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={resetView}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Reset view"
          >
            <Maximize2 size={16} />
          </button>
          <button
            onClick={exportPng}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
          >
            <Download size={14} /> Export PNG
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative"
        style={{ cursor: dragging.current ? "grabbing" : "grab" }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          onClick={onClick}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={() => { lastTouch.current = null; }}
          className="w-full h-full"
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 bg-white dark:bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
          {[
            { label: "Root", color: "#4f46e5" },
            { label: "Branch 1", color: "#7c3aed" },
            { label: "Branch 2", color: "#0891b2" },
            { label: "Branch 3", color: "#059669" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Selected node info */}
        {selectedId && (
          <div className="absolute top-4 right-4 bg-white dark:bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl px-4 py-3 border border-amber-300 shadow-sm max-w-[200px]">
            <p className="text-[11px] text-amber-600 font-semibold uppercase tracking-wide mb-1">Selected</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 line-clamp-2">
              {layout.get(selectedId)?.label}
            </p>
            <button
              onClick={() => setSelectedId(null)}
              className="text-[10px] text-slate-400 hover:text-slate-600 dark:text-slate-400 mt-2 underline"
            >
              Deselect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
