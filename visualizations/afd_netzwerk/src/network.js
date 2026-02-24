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
  const g = svg.append('g');  // Create a group for all graph elements

  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])  // Min zoom 0.1x, max zoom 4x
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

  // Separate mitglied edges (thick background lines)
  const mitgliedEdges = graphEdges.filter(e => e.relationship === RELATIONSHIP_MITGLIED);
  const otherEdges = graphEdges.filter(e => e.relationship !== RELATIONSHIP_MITGLIED);

  // Force simulation
  const centerX = width / 2;
  const centerY = height / 2;

  simulation = d3.forceSimulation(graphNodes)
    .force('link', d3.forceLink(graphEdges)
      .id(d => d.id)
      .distance(d => {
        // Shorter links to institutions to create clusters
        if (d.source.institution || d.target.institution) { return 60; }
        if (d.relationship === RELATIONSHIP_MITGLIED) { return 80; }
        if (d.relationship === RELATIONSHIP_EMPLOY) { return 100; }
        return 130;
      })
      .strength(0.3)
    )
    .force('charge', d3.forceManyBody()
      .strength(d => d.institution ? -400 : -250)  // Institutions repel more strongly
    )
    .force('center', d3.forceCenter(centerX, centerY))
    .force('forceX', d3.forceX(centerX).strength(0.03))
    .force('forceY', d3.forceY(centerY).strength(0.03))
    .force('collision', d3.forceCollide().radius(d => getNodeRadius(d) + 18));

  // Render mitglied edges (background)
  const mitgliedLines = g.append('g')
    .selectAll('line')
    .data(mitgliedEdges)
    .join('line')
    .attr('class', d => `link ${cssClassForRelationship(d.relationship)}`);

  // Render other edges
  const linkLines = g.append('g')
    .selectAll('line')
    .data(otherEdges)
    .join('line')
    .attr('class', d => `link ${cssClassForRelationship(d.relationship)}`)
    .attr('marker-end', d => d.relationship === RELATIONSHIP_EMPLOY ? 'url(#arrow-beschäftigt)' : null);

  // Render nodes
  const nodeGroups = g.append('g')
    .selectAll('g')
    .data(graphNodes)
    .join('g')
    .attr('class', 'node')
    .call(d3.drag()
      .on('start', (event, d) => dragStarted(event, d))
      .on('drag', (event, d) => dragged(event, d))
      .on('end', (event, d) => dragEnded(event, d)))
    .on('mouseenter', (event, d) => showTooltip(event, d))
    .on('mousemove', moveTooltip)
    .on('mouseleave', hideTooltip);

  // Draw circles for anonymous people (gray, no photos)
  nodeGroups.filter(d => d.anonymous && !d.institution)
    .append('circle')
    .attr('r', d => getNodeRadius(d))
    .attr('class', 'anonymous');

// Draw circles for named people
nodeGroups.filter(d => !d.anonymous && !d.institution)
  .append('circle')
  .attr('r', d => getNodeRadius(d))
  .attr('class', 'named')
  .attr('data-photo-id', d => getSafeId(d.id));

  // After rendering, try to load photos
  nodeGroups.filter(d => !d.anonymous && !d.institution)
    .each(function(d) {
      const circle = d3.select(this).select('circle');
      const photoId = getSafeId(d.id);
      const imageUrl = `data/faces/${photoId}.jpg`;

      // Test if image exists
      const img = new Image();
      img.onload = () => {
        // Image exists - apply pattern
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
      img.onerror = () => {
        // Image doesn't exist - keep white fill
        // Do nothing, CSS fallback applies
      };
      img.src = imageUrl;
    });

  // Draw diamonds for institutions
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

  // Update positions each tick
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

    nodeGroups.attr('transform', d => `translate(${d.x},${d.y})`);
  });
}

function getNodeRadius(node) {
  return node.institution ? 18 : (node.anonymous ? 7 : 14);
}

function shortenName(name, max) {
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}

function cssClassForRelationship(rel) {
  if (rel === RELATIONSHIP_FAMILIAL) return 'familiäre-verbindung';
  if (rel === RELATIONSHIP_EMPLOY) return 'beschäftigt';
  if (rel === RELATIONSHIP_MITGLIED) return 'mitglied';
  if (rel === RELATIONSHIP_NAHESTEHEND) return 'nahestehend';
  return 'unknown';
}

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

function buildAdjacencyMap(nodes, edges) {
  const map = new Map();
  nodes.forEach(n => map.set(n.id, []));
  edges.forEach(e => {
    if (map.has(e.source)) map.get(e.source).push({ other: e.target, relationship: e.relationship });
    if (map.has(e.target)) map.get(e.target).push({ other: e.source, relationship: e.relationship });
  });
  return map;
}

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
      row.innerHTML = `<span class="tip-conn-type">${getDisplayRelationship(c.relationship)}:</span> ${c.other.replace(/^[?!]/, '')}`;
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

/**
 * Check URL for center parameter and pin that node to viewport center
 */
function handleUrlParameter() {
  const urlParams = new URLSearchParams(window.location.search);
  const centerNodeId = urlParams.get('center');

  if (centerNodeId) {
    const container = document.getElementById('graph-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;

    // Find and pin the node
    for (const node of currentNodes) {
      if (node.id === centerNodeId) {
        node.fx = centerX;
        node.fy = centerY;

        // Highlight it
        setTimeout(() => {
          d3.selectAll('.node circle, .node rect')
            .classed('highlighted', d => d.id === node.id);
        }, 500);

        console.log('Centered on:', node.name);
        break;
      }
    }
  }
}

function centerOnNode(node) {
  const container = document.getElementById('graph-container');
  const width = container.clientWidth;
  const height = container.clientHeight;

  console.log('Centering on:', node.name, 'at', node.x, node.y);

  // Calculate how much to move
  const targetX = width / 2;
  const targetY = height / 2;
  const dx = targetX - node.x;
  const dy = targetY - node.y;

  // Move all nodes
  currentNodes.forEach(n => {
    n.x += dx;
    n.y += dy;
    // Also update fixed positions if they exist
    if (n.fx !== null && n.fx !== undefined) n.fx += dx;
    if (n.fy !== null && n.fy !== undefined) n.fy += dy;
  });

  // Restart simulation gently
  simulation.alpha(0.1).restart();

  // Highlight the node
  d3.selectAll('.node circle, .node rect')
    .classed('highlighted', d => d.id === node.id);
}

// Add this at the very end of the file
window.addEventListener('resize', () => {
  // Debounce resize events
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (currentNodes.length > 0) {
      renderGraph(currentNodes, currentEdges);
    }
  }, 250); // Wait 250ms after resize stops before re-rendering
});
