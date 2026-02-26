/**
 * Network Graph Rendering with D3.js
 */

import * as d3 from 'd3';
import {
  RELATIONSHIP_FAMILIAL,
  RELATIONSHIP_EMPLOY,
  RELATIONSHIP_MITGLIED,
  RELATIONSHIP_NAHESTEHEND
} from './app.js';

function getSafeId(id) {
  return id
    .toLowerCase()
    .replace(/[,\.]/g, '')
    .replace(/\s+/g, '-')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

/**
 * Get display name for relationship (tooltip-friendly)
 */
function getDisplayRelationship(rel) {
  if (rel === RELATIONSHIP_EMPLOY) return 'Beschäftiungsverhältnis mit';
  if (rel === RELATIONSHIP_NAHESTEHEND) return 'andere Verbindung';
  return rel; // familiäre Verbindung and Mitglied stay the same
}

let simulation;
let adjacencyMap;

/**
 * Handle window resize - re-render the graph
 */
let resizeTimeout;
let currentNodes = [];
let currentEdges = [];

/**
 * Render the network graph
 */
export function renderGraph(nodes, edges) {

  currentNodes = nodes;
  currentEdges = edges;

  handleUrlParameter();

  console.log(`Rendering: ${nodes.length} nodes, ${edges.length} edges`);

  const container = document.getElementById('graph-container');
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Clear existing
  d3.select('#graph-svg').selectAll('*').remove();

  const svg = d3.select('#graph-svg');

  // Add pan and zoom
  const g = svg.append('g');

  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);

  // Define arrow markers for directed edges
  const defs = g.append('defs');

  defs.selectAll('marker')
    .data(['beschäftigt'])
    .join('marker')
    .attr('id', d => `arrow-${d}`)
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 8)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#1a4a6b')
    .attr('opacity', 0.65);

  // Build adjacency for tooltips
  adjacencyMap = buildAdjacencyMap(nodes, edges);

  // Make copies (D3 mutates)
  const graphNodes = nodes.map(n => Object.assign({}, n));
  const graphEdges = edges.map(e => Object.assign({}, e));

  // ── MULTI-EDGE DETECTION ──────────────────────────────────────────────────
  // Count how many edges exist between each unordered node pair.
  // Only edges in the same pair that appear more than once get curved paths.
  const pairCounts = new Map();
  for (const e of graphEdges) {
    const sourceId = typeof e.source === 'object' ? e.source.id : e.source;
    const targetId = typeof e.target === 'object' ? e.target.id : e.target;
    const key = [sourceId, targetId].sort().join('||');
    pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
  }

  // Set of pair keys where more than one edge exists
  const multiEdgePairs = new Set(
    [...pairCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([key]) => key)
  );

  // Returns true if this edge belongs to a multi-edge pair.
  // Works both before and after D3 resolves string ids to node objects.
  function isMultiEdge(edge) {
    const sourceId = typeof edge.source === 'object' ? edge.source.id : edge.source;
    const targetId = typeof edge.target === 'object' ? edge.target.id : edge.target;
    return multiEdgePairs.has([sourceId, targetId].sort().join('||'));
  }

  // Separate mitglied edges (thick background lines, always straight)
  const mitgliedEdges = graphEdges.filter(e => e.relationship === RELATIONSHIP_MITGLIED);
  const otherEdges    = graphEdges.filter(e => e.relationship !== RELATIONSHIP_MITGLIED);

  // Within other edges, split into straight (single) and curved (multi)
  const straightEdges = otherEdges.filter(e => !isMultiEdge(e));
  const curvedEdges   = otherEdges.filter(e =>  isMultiEdge(e));

  // Force simulation
  const centerX = width / 2;
  const centerY = height / 2;

  simulation = d3.forceSimulation(graphNodes)
    .force('link', d3.forceLink(graphEdges)
      .id(d => d.id)
      .distance(d => {
        if (d.source.institution || d.target.institution) { return 60; }
        if (d.relationship === RELATIONSHIP_MITGLIED) { return 80; }
        if (d.relationship === RELATIONSHIP_EMPLOY) { return 100; }
        return 130;
      })
      .strength(0.3)
    )
    .force('charge', d3.forceManyBody()
      .strength(d => d.institution ? -400 : -250)
    )
    .force('center', d3.forceCenter(centerX, centerY))
    .force('forceX', d3.forceX(centerX).strength(0.03))
    .force('forceY', d3.forceY(centerY).strength(0.03))
    .force('collision', d3.forceCollide().radius(d => getNodeRadius(d) + 18));

  // ── RENDER MITGLIED EDGES (background, always straight lines) ────────────
  const mitgliedLines = g.append('g')
    .selectAll('line')
    .data(mitgliedEdges)
    .join('line')
    .attr('class', d => `link ${cssClassForRelationship(d.relationship)}`);

  // ── RENDER STRAIGHT EDGES (single edges between a pair) ──────────────────
  const linkLines = g.append('g')
    .selectAll('line')
    .data(straightEdges)
    .join('line')
    .attr('class', d => `link ${cssClassForRelationship(d.relationship)}`)
    .attr('marker-end', d => d.relationship === RELATIONSHIP_EMPLOY ? 'url(#arrow-beschäftigt)' : null);

  // ── RENDER CURVED EDGES (multi-edges between the same pair) ──────────────
  const linkPaths = g.append('g')
    .selectAll('path')
    .data(curvedEdges)
    .join('path')
    .attr('class', d => `link ${cssClassForRelationship(d.relationship)}`)
    .attr('marker-end', d => d.relationship === RELATIONSHIP_EMPLOY ? 'url(#arrow-beschäftigt)' : null);

  // ── RENDER NODES ──────────────────────────────────────────────────────────
  const nodeGroups = g.append('g')
    .selectAll('g')
    .data(graphNodes)
    .join('g')
    .attr('class', 'node')
    .call(d3.drag()
      .on('start', (event, d) => dragStarted(event, d))
      .on('drag',  (event, d) => dragged(event, d))
      .on('end',   (event, d) => dragEnded(event, d)))
    .on('mouseenter', (event, d) => showTooltip(event, d))
    .on('mousemove', moveTooltip)
    .on('mouseleave', hideTooltip);

  // Anonymous people (gray circles, no photos)
  nodeGroups.filter(d => d.anonymous && !d.institution)
    .append('circle')
    .attr('r', d => getNodeRadius(d))
    .attr('class', 'anonymous');

  // Named people
  nodeGroups.filter(d => !d.anonymous && !d.institution)
    .append('circle')
    .attr('r', d => getNodeRadius(d))
    .attr('class', 'named')
    .attr('data-photo-id', d => getSafeId(d.id));

  // Try to load photos for named people
  nodeGroups.filter(d => !d.anonymous && !d.institution)
    .each(function(d) {
      const circle = d3.select(this).select('circle');
      const photoId = getSafeId(d.id);
      const imageUrl = `data/faces/${photoId}.jpg`;

      const img = new Image();
      img.onload = () => {
        d.hasPhoto = true;
        defs.append('pattern')
          .attr('id', `photo-${photoId}`)
          .attr('patternUnits', 'objectBoundingBox')
          .attr('width', 1)
          .attr('height', 1)
          .append('image')
          .attr('href', imageUrl)
          .attr('width', 40)
          .attr('height', 40)
          .attr('x', -6)
          .attr('y', -6)
          .attr('preserveAspectRatio', 'xMidYMid slice');

        circle.style('fill', `url(#photo-${photoId})`);
      };
      img.src = imageUrl;
    });

  // Institution diamonds
  nodeGroups.filter(d => d.institution)
    .append('rect')
    .attr('class', 'institution')
    .attr('width', 20)
    .attr('height', 20)
    .attr('x', -10)
    .attr('y', -10)
    .attr('transform', 'rotate(45)');

  // Labels for named people
  nodeGroups.filter(d => !d.anonymous && !d.institution)
    .append('text')
    .attr('dy', d => getNodeRadius(d) + 12)
    .text(d => shortenName(d.name, 20));

  // Labels for anonymous
  nodeGroups.filter(d => d.anonymous)
    .append('text')
    .attr('class', 'anon-label')
    .attr('dy', d => getNodeRadius(d) + 10)
    .text(d => shortenName(d.name, 20));

  // Labels for institutions
  nodeGroups.filter(d => d.institution)
    .append('text')
    .attr('class', 'institution-label')
    .attr('dy', 24)
    .text(d => shortenName(d.name, 18));

  // ── TICK ──────────────────────────────────────────────────────────────────
  simulation.on('tick', () => {

    mitgliedLines
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    linkLines
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => edgeEnd(d).x)
      .attr('y2', d => edgeEnd(d).y);

    // Curved paths recalculate their bezier control point each tick
    linkPaths.attr('d', d => curvedPath(d));

    nodeGroups.attr('transform', d => `translate(${d.x},${d.y})`);
  });
}

// ── GEOMETRY HELPERS ────────────────────────────────────────────────────────

function getNodeRadius(node) {
  return node.institution ? 18 : (node.anonymous ? 7 : 14);
}

function shortenName(name, max) {
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}

function cssClassForRelationship(rel) {
  if (rel === RELATIONSHIP_FAMILIAL)    return 'familiäre-verbindung';
  if (rel === RELATIONSHIP_EMPLOY)      return 'beschäftigt';
  if (rel === RELATIONSHIP_MITGLIED)    return 'mitglied';
  if (rel === RELATIONSHIP_NAHESTEHEND) return 'nahestehend';
  return 'unknown';
}

/**
 * Compute the endpoint of a straight edge, shortened so arrowheads
 * don't overlap the target node circle.
 */
function edgeEnd(d) {
  const dx = d.target.x - d.source.x;
  const dy = d.target.y - d.source.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const r = getNodeRadius(d.target) + 4;
  return {
    x: d.target.x - (dx / dist) * r,
    y: d.target.y - (dy / dist) * r
  };
}

/**
 * Compute a quadratic bezier path for a curved (multi-)edge.
 *
 * The control point is offset perpendicularly from the midpoint of the
 * source–target line. The offset direction depends on relationship type:
 *   - beschäftigt  → curves upward  (negative perpendicular)
 *   - all others   → curves downward (positive perpendicular)
 *
 * The endpoint is shortened so arrowheads land on the node surface.
 */
function curvedPath(d) {
  const sx = d.source.x;
  const sy = d.source.y;
  const tx = d.target.x;
  const ty = d.target.y;

  // Midpoint between source and target
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;

  // Perpendicular unit vector (rotated 90° from the edge direction)
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const px = -dy / len;
  const py =  dx / len;

  // beschäftigt curves in the opposite direction from familial/nahestehend
  // so that both edges between the same pair are clearly visible
  const CURVE_AMOUNT = 40;
  const sign = d.relationship === RELATIONSHIP_EMPLOY ? -1 : 1;

  const cpx = mx + px * CURVE_AMOUNT * sign;
  const cpy = my + py * CURVE_AMOUNT * sign;

  // Shorten the endpoint toward the control point so the arrowhead
  // doesn't overlap the target node
  const r = getNodeRadius(d.target) + 4;
  const endDx = tx - cpx;
  const endDy = ty - cpy;
  const endLen = Math.sqrt(endDx * endDx + endDy * endDy) || 1;
  const ex = tx - (endDx / endLen) * r;
  const ey = ty - (endDy / endLen) * r;

  return `M${sx},${sy} Q${cpx},${cpy} ${ex},${ey}`;
}

// ── ADJACENCY MAP ────────────────────────────────────────────────────────────

function buildAdjacencyMap(nodes, edges) {
  const map = new Map();
  nodes.forEach(n => map.set(n.id, []));
  edges.forEach(e => {
    if (map.has(e.source)) map.get(e.source).push({ other: e.target, relationship: e.relationship });
    if (map.has(e.target)) map.get(e.target).push({ other: e.source, relationship: e.relationship });
  });
  return map;
}

// ── DRAG HANDLERS ────────────────────────────────────────────────────────────

function dragStarted(event, d) {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragEnded(event, d) {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

// ── TOOLTIP ───────────────────────────────────────────────────────────────────

function showTooltip(event, d) {
  const tip = document.getElementById('tooltip');
  document.getElementById('tip-name').textContent = d.name;

  const conns = adjacencyMap.get(d.id) || [];
  const tipConns = document.getElementById('tip-connections');
  tipConns.innerHTML = '';

  if (conns.length === 0) {
    tipConns.textContent = 'Keine Verbindungen';
  } else {
    conns.forEach(c => {
      const row = document.createElement('div');
      row.className = 'tip-conn-row';
      const otherName = typeof c.other === 'object'
        ? c.other.name
        : c.other.replace(/^[?!]/, '');
      row.innerHTML = `<span class="tip-conn-type">${getDisplayRelationship(c.relationship)}:</span> ${otherName}`;
      tipConns.appendChild(row);
    });
  }

  tip.style.opacity = '1';
  moveTooltip(event);
}

function moveTooltip(event) {
  const tip = document.getElementById('tooltip');
  const x = event.pageX + 14;
  const y = event.pageY - 10;
  const maxX = window.innerWidth - tip.offsetWidth - 10;
  tip.style.left = Math.min(x, maxX) + 'px';
  tip.style.top = y + 'px';
}

function hideTooltip() {
  document.getElementById('tooltip').style.opacity = '0';
}

// ── URL PARAMETER ─────────────────────────────────────────────────────────────

/**
 * Check URL for ?center= parameter and pin that node to the viewport centre.
 * Matches exactly on the raw node id (including any ! or ? sigil prefix).
 * Silently ignored if the node doesn't exist.
 */
function handleUrlParameter() {
  const urlParams = new URLSearchParams(window.location.search);
  const centerNodeId = urlParams.get('center');

  if (!centerNodeId) { return; }

  const container = document.getElementById('graph-container');
  const centerX = container.clientWidth  / 2;
  const centerY = container.clientHeight / 2;

  for (const node of currentNodes) {
    if (node.id === centerNodeId) {
      node.fx = centerX;
      node.fy = centerY;
      console.log('Centered on:', node.name);
      break;
      // No match → silently ignored
    }
  }
}

// ── RESIZE ────────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (currentNodes.length > 0) {
      renderGraph(currentNodes, currentEdges);
    }
  }, 250);
});
