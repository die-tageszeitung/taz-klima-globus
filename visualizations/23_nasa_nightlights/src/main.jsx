import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '@shared/styles/globe-common.css';
import './styles.css';

const rootElement = document.getElementById('root');

ReactDOM.createRoot(rootElement).render(
  <App />
);
