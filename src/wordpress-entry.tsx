// WordPress plugin entry — mounts React app into #wrapmatchpro-root
// Uses Shadow DOM to isolate styles from WordPress theme CSS
// Built as IIFE bundle by `vite build --mode wordpress`

import { createRoot } from 'react-dom/client';
import App from './App';
import inlineCss from './index.css?inline';

const container = document.getElementById('wrapmatchpro-root');
if (container) {
  // Use Shadow DOM for full style isolation from WP theme
  const shadow = container.attachShadow({ mode: 'open' });

  // Inject Tailwind styles inside shadow root
  const style = document.createElement('style');
  style.textContent = inlineCss;
  shadow.appendChild(style);

  // Mount point with base font size to anchor em-based Tailwind sizing
  const mountPoint = document.createElement('div');
  mountPoint.style.fontSize = '16px';
  mountPoint.style.width = '100%';
  shadow.appendChild(mountPoint);

  const root = createRoot(mountPoint);
  root.render(<App />);
}
