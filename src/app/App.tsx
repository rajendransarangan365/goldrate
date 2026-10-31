import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { DashboardPage } from '../pages/DashboardPage';
import { InternationalPage } from '../pages/InternationalPage';
import { IndiaPage } from '../pages/IndiaPage';
import { HistoryPage } from '../pages/HistoryPage';
import { ForecastPage } from '../pages/ForecastPage';
import { CalculatorPage } from '../pages/CalculatorPage';
import { WhatsAppImportPage } from '../pages/WhatsAppImportPage';
import { ManualEntryPage } from '../pages/ManualEntryPage';
import { AlertsPage } from '../pages/AlertsPage';
import { AiLabPage } from '../pages/AiLabPage';
import { SourcesPage } from '../pages/SourcesPage';
import { SettingsPage } from '../pages/SettingsPage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage setActiveTab={setActiveTab} />;
      case 'international':
        return <InternationalPage />;
      case 'india':
        return <IndiaPage setActiveTab={setActiveTab} />;
      case 'history':
        return <HistoryPage />;
      case 'forecast':
        return <ForecastPage />;
      case 'calculator':
        return <CalculatorPage />;
      case 'whatsapp':
        return <WhatsAppImportPage setActiveTab={setActiveTab} />;
      case 'manual':
        return <ManualEntryPage setActiveTab={setActiveTab} />;
      case 'alerts':
        return <AlertsPage />;
      case 'ailab':
        return <AiLabPage />;
      case 'sources':
        return <SourcesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderActivePage()}
    </Layout>
  );
};

export default App;

