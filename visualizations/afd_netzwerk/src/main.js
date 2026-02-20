/**
 * Entry point with lazy loading
 */

import './styles.css';

let visualizationLoaded = false;

// Show load button, wait for user interaction
document.getElementById('load-viz-button')?.addEventListener('click', async () => {
  if (visualizationLoaded) return;

  const button = document.getElementById('load-viz-button');
  const placeholder = document.getElementById('load-placeholder');
  const graphContainer = document.getElementById('graph-container');

  button.disabled = true;
  button.textContent = 'Wird geladen...';

  try {
    // Dynamically import D3 and app logic
    const [d3Module, appModule] = await Promise.all([
      import('d3'),
      import('./app.js')
    ]);

    // Make D3 globally available
    window.d3 = d3Module;

    // Hide placeholder, show graph
    placeholder.style.display = 'none';
    graphContainer.style.display = 'block';

    // Initialize the app
    appModule.initializeApp();

    visualizationLoaded = true;

  } catch (error) {
    console.error('Failed to load visualization:', error);
    button.textContent = 'Fehler beim Laden';
    button.disabled = false;
    alert('Die Visualisierung konnte nicht geladen werden. Bitte versuchen Sie es erneut.');
  }
});

// Toggle labels for screenshots
document.getElementById('toggle-labels')?.addEventListener('click', (e) => {
  document.body.classList.toggle('screenshot-mode');
  e.target.textContent = document.body.classList.contains('screenshot-mode')
    ? 'Labels einblenden'
    : 'Labels ausblenden';
});

// Share link - copy to clipboard
document.getElementById('share-link')?.addEventListener('click', async (e) => {
  e.preventDefault();
  try {
    await navigator.clipboard.writeText(window.location.href);
    e.target.textContent = '✓ Link kopiert!';
    setTimeout(() => {
      e.target.textContent = 'Link teilen';
    }, 2000);
  } catch (err) {
    alert('URL: ' + window.location.href);
  }
});
