import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UsageStats from './pages/home/Home';
import Shortcuts from './pages/shortcuts/Shortcuts';
import Settings from './pages/settings/Settings';
import TranscriptionHistory from './pages/transcription-history/TranscriptionHistory';
import QuickStart from './pages/quick-start/QuickStart';
import Help from './pages/help/Help';
import SecondScreen from './voice/Voice';
import { ThemeProvider } from "./components/theme-provider";
import { DashboardLayout } from "./components/dashboard-layout";
import { UpdateProvider } from "./lib/update-context";

function Router() {
  return (
    <BrowserRouter>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <UpdateProvider>
          <Routes>
            {/* Getting Started */}
            <Route path="/quick-start" element={
              <DashboardLayout>
                <QuickStart />
              </DashboardLayout>
            } />
            <Route path="/shortcuts" element={
              <DashboardLayout>
                <Shortcuts />
              </DashboardLayout>
            } />

            {/* Analytics */}
            <Route path="/" element={
              <DashboardLayout>
                <UsageStats />
              </DashboardLayout>
            } />
            <Route path="/history" element={
              <DashboardLayout>
                <TranscriptionHistory />
              </DashboardLayout>
            } />

            {/* Settings */}
            <Route path="/preferences" element={
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            } />
            <Route path="/help" element={
              <DashboardLayout>
                <Help />
              </DashboardLayout>
            } />

            {/* Voice Overlay (no dashboard layout) */}
            <Route path="/voice" element={<SecondScreen />} />
          </Routes>
        </UpdateProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default Router;
