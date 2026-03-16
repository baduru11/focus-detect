import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import Dashboard from "@/pages/Dashboard";
import Profiles from "@/pages/Profiles";
import Stats from "@/pages/Stats";
import Settings from "@/pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
