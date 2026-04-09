import { useState } from 'react';
import { WizardProvider } from './context/WizardContext';
import { WizardShell } from './components/WizardShell';
import { ColorFinderPage } from './components/colorFinder/ColorFinderPage';

type View = 'calculator' | 'color-finder';

function App() {
  const [view, setView] = useState<View>('calculator');

  if (view === 'color-finder') {
    return <ColorFinderPage onBack={() => setView('calculator')} />;
  }

  return (
    <WizardProvider>
      <WizardShell />
    </WizardProvider>
  );
}

export default App;
