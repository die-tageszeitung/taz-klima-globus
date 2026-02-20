/**
 * Application Controller
 * Handles data fetching and initialization
 */

import { renderGraph } from './network.js';

const GIST_URL = 'https://gist.githubusercontent.com/LalonSander/69fbac7123b1149309c11681e19928c5/raw/afd_netzwerk.csv';

// Relationship constants
export const RELATIONSHIP_FAMILIAL = 'familiäre Verbindung';
export const RELATIONSHIP_EMPLOY = 'beschäftigt';
export const RELATIONSHIP_MITGLIED = 'Mitglied';
export const RELATIONSHIP_NAHESTEHEND = 'nahestehend';

let allNodes = [];
let allEdges = [];

/**
 * Initialize the application
 */
export function initializeApp() {
  console.log('Initializing AfD Network Visualization');
  fetchDataAndRender();
}

/**
 * Fetch data from GitHub Gist and render the graph
 */
async function fetchDataAndRender() {
  const emptyState = document.getElementById('empty-state');
  const emptyTitle = document.getElementById('empty-title');
  const emptyBody = document.getElementById('empty-body');

  try {
    emptyState.style.display = 'flex';
    emptyTitle.textContent = 'Daten werden geladen…';
    emptyBody.textContent = 'Verbindung wird hergestellt.';

    const response = await fetch(GIST_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();

    if (csvText.trimStart().startsWith('<!DOCTYPE') || csvText.trimStart().startsWith('<html')) {
      throw new Error('Ungültiges Datenformat erhalten.');
    }

    const result = parseCsvText(csvText);

    if (result.skippedRows.length > 0) {
      console.warn('Übersprungene Zeilen:', result.skippedRows);
    }

    if (result.nodes.length === 0) {
      throw new Error('Keine gültigen Einträge gefunden.');
    }

    allNodes = result.nodes;
    allEdges = result.edges;

    emptyState.style.display = 'none';

    renderGraph(allNodes, allEdges);

  } catch (error) {
    console.error('Fehler beim Laden:', error);
    emptyTitle.textContent = 'Fehler beim Laden';
    emptyBody.textContent = error.message;
    emptyState.style.display = 'flex';
  }
}

/**
 * Parse CSV from Google Sheets format
 * Expected columns: person_a, person_b, relationship, person_a_anonymous, person_b_anonymous, institution
 */
function parseCsvText(csvText) {
/**
 * Parse CSV with format: person_a, beziehung, person_b
 * Names starting with ? are anonymous
 * Names starting with ! are institutions
 */
  const lines = csvText.split('\n');
  const nodeMap = new Map();
  const edgeList = [];
  const skipped = [];

  // Skip header row (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = splitCsvLine(line);

    if (cols.length < 3) {
      skipped.push({ line: i + 1, reason: 'Nicht genug Spalten', raw: line });
      continue;
    }

    const personA = cols[0].trim();
    const relationship = cols[1].trim();
    const personB = cols[2].trim();

    if (!personA || !personB || !relationship) {
      skipped.push({ line: i + 1, reason: 'Leere Felder', raw: line });
      continue;
    }

    // Determine node properties from name prefixes
    const anonA = personA.startsWith('?');
    const instA = personA.startsWith('!');
    const anonB = personB.startsWith('?');
    const instB = personB.startsWith('!');

    // Add nodes (remove prefix from name)
    if (!nodeMap.has(personA)) {
      nodeMap.set(personA, {
        id: personA,
        name: personA.replace(/^[?!]/, ''), // Remove ? or ! prefix
        anonymous: anonA,
        institution: instA
      });
    }

    if (!nodeMap.has(personB)) {
      nodeMap.set(personB, {
        id: personB,
        name: personB.replace(/^[?!]/, ''),
        anonymous: anonB,
        institution: instB
      });
    }

    // Add edge
    edgeList.push({
      source: personA,
      target: personB,
      relationship: relationship
    });
  }

  console.log(`Parsed: ${nodeMap.size} nodes, ${edgeList.length} edges`);

  return {
    nodes: Array.from(nodeMap.values()),
    edges: edgeList,
    skippedRows: skipped
  };
}

/**
 * Split CSV line respecting quoted fields
 */
function splitCsvLine(line) {
  const result = [];
  let field = '';
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  result.push(field);
  return result;
}
