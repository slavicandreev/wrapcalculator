// WordPress plugin entry — mounts React app into #wrapmatchpro-root
// Built as IIFE bundle by `vite build --mode wordpress`

import { createRoot } from 'react-dom/client';
import App from './App';
import inlineCss from './index.css?inline';

const container = document.getElementById('wrapmatchpro-root');
if (container) {
  // Inject styles into the page
  const style = document.createElement('style');
  style.textContent = inlineCss;
  document.head.appendChild(style);

  const root = createRoot(container);
  root.render(<App />);
}
