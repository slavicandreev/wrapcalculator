import { useState, useEffect } from 'react';
import { WizardProvider } from './context/WizardContext';
import { WizardShell } from './components/WizardShell';
import { ColorFinderPage } from './components/colorFinder/ColorFinderPage';

type View = 'calculator' | 'color-finder';

function getViewFromPath(): View {
  return window.location.pathname.startsWith('/color-finder') ? 'color-finder' : 'calculator';
}

function App() {
  const [view, setView] = useState<View>(getViewFromPath);

  useEffect(() => {
    const handlePopState = () => setView(getViewFromPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string, v: View) => {
    history.pushState(null, '', path);
    setView(v);
  };

  if (view === 'color-finder') {
    return <ColorFinderPage onBack={() => navigateTo('/', 'calculator')} />;
  }

  return (
    <WizardProvider>
      <WizardShell />
    </WizardProvider>
  );
}

export default App;
