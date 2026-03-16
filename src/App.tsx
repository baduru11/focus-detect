import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AppProvider } from "@/context/AppContext";
import { AlarmController } from "@/components/alarm/AlarmController";
import { useApp } from "@/context/AppContext";
import Dashboard from "@/pages/Dashboard";
import Profiles from "@/pages/Profiles";
import Stats from "@/pages/Stats";
import Settings from "@/pages/Settings";
import AlarmPage from "@/pages/AlarmPage";

function AlarmOverlay() {
  const { alarmLevel, dismissAlarm } = useApp();
  return <AlarmController alarmLevel={alarmLevel as 0 | 1 | 2 | 3} onDismiss={dismissAlarm} />;
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/alarm" element={<AlarmPage />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
        <AlarmOverlay />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
