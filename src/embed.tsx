// Embed entry point — registers <wrap-calculator> as a Web Component
// Built as IIFE bundle by `vite build --mode embed`
// Usage: <script src="embed.js" data-mode="inline" data-container="#my-div"></script>

import { createRoot } from 'react-dom/client';
import { WizardProvider } from './context/WizardContext';
import { WizardShell } from './components/WizardShell';
import type { EmbedConfig } from './types';
import inlineCss from './index.css?inline';

class WrapCalculatorWidget extends HTMLElement {
  private _root?: ReturnType<typeof createRoot>;
  private _shadowRoot?: ShadowRoot;

  connectedCallback() {
    // Ensure the custom element is block-level, fills its container, and has a minimum height
    this.style.display = 'block';
    this.style.width = '100%';
    this.style.minHeight = '700px';

    this._shadowRoot = this.attachShadow({ mode: 'open' });

    // Inject styles into shadow root for isolation
    if (inlineCss) {
      const style = document.createElement('style');
      style.textContent = inlineCss;
      this._shadowRoot.appendChild(style);
    }

    // Mount point — fill available width
    const container = document.createElement('div');
    container.style.width = '100%';
    this._shadowRoot.appendChild(container);

    // Read config from data attributes
    const config: EmbedConfig = {
      ctaUrl: this.getAttribute('data-cta-url') ?? '',
      accentColor: this.getAttribute('data-accent-color') ?? '#3b82f6',
      mode: (this.getAttribute('data-mode') ?? 'inline') as 'inline' | 'modal',
    };

    this._root = createRoot(container);
    this._root.render(
      <WizardProvider>
        <WizardShell />
      </WizardProvider>
    );

    // Store config for potential use by child components
    (this as unknown as Record<string, unknown>)._embedConfig = config;
  }

  disconnectedCallback() {
    this._root?.unmount();
  }
}

// Register the custom element (guard against double-registration)
if (!customElements.get('wrap-calculator')) {
  customElements.define('wrap-calculator', WrapCalculatorWidget);
}

// Auto-initialize from script tag data attributes
(function autoInit() {
  // Find our script tag
  const scripts = document.querySelectorAll('script[src*="embed"]');
  let ourScript: HTMLScriptElement | null = null;
  scripts.forEach(s => {
    if ((s as HTMLScriptElement).src.includes('embed')) {
      ourScript = s as HTMLScriptElement;
    }
  });

  const script = ourScript ?? (document.currentScript as HTMLScriptElement | null);
  if (!script) return;

  const mode = script.getAttribute('data-mode') ?? 'inline';
  const containerId = script.getAttribute('data-container');
  const ctaUrl = script.getAttribute('data-cta-url') ?? '';
  const accentColor = script.getAttribute('data-accent-color') ?? '#3b82f6';

  const widget = document.createElement('wrap-calculator');
  widget.setAttribute('data-cta-url', ctaUrl);
  widget.setAttribute('data-accent-color', accentColor);
  widget.setAttribute('data-mode', mode);

  if (mode === 'inline' && containerId) {
    const target = document.querySelector(containerId);
    if (target) {
      target.appendChild(widget);
    } else {
      console.warn(`[WrapCalc] Container "${containerId}" not found. Appending to body.`);
      document.body.appendChild(widget);
    }
  } else if (mode === 'modal') {
    // Create floating "Get a Quote" button
    injectModalButton(widget, script, accentColor);
  } else if (mode === 'inline') {
    // No container specified — insert after script tag
    script.parentNode?.insertBefore(widget, script.nextSibling);
  }
})();

function injectModalButton(
  widget: HTMLElement,
  script: HTMLScriptElement,
  accentColor: string
) {
  const buttonLabel = script.getAttribute('data-button-label') ?? 'Get a Wrap Quote';

  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    display: none; position: fixed; inset: 0; z-index: 9998;
    background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
  `;

  // Create modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    z-index: 9999; width: min(95vw, 960px); max-height: 90vh;
    background: white; border-radius: 16px; overflow: auto;
    box-shadow: 0 25px 50px rgba(0,0,0,0.25);
  `;
  modal.appendChild(widget);

  // Create button
  const btn = document.createElement('button');
  btn.textContent = buttonLabel;
  btn.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 9997;
    background: ${accentColor}; color: white;
    border: none; border-radius: 50px; padding: 14px 24px;
    font-size: 15px; font-weight: 600; cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: Inter, system-ui, sans-serif;
  `;

  btn.addEventListener('click', () => {
    overlay.style.display = 'block';
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.style.display = 'none';
  });

  document.body.appendChild(overlay);
  document.body.appendChild(modal);
  document.body.appendChild(btn);
}
