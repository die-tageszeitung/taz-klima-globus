/**
 * Entry point for AfD Network Visualization
 * Loads styles and initializes the application
 */

import './styles.css';
import { initializeApp } from './app.js';  // ADD THIS LINE

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});
