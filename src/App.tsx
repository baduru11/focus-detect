import { Component, type ReactNode } from "react";
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
import Widget from "@/pages/Widget";

// Error boundary for main app — catches render crashes in Dashboard, Profiles, etc.
class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App error boundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", height: "100vh",
          background: "#0a0a0f", color: "#e0e0ff", fontFamily: "system-ui",
        }}>
          <h2 style={{ color: "#ff003c", marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: "#888", marginBottom: 16, maxWidth: 400, textAlign: "center" }}>
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: "rgba(0, 240, 255, 0.1)", border: "1px solid rgba(0, 240, 255, 0.3)",
              color: "#00f0ff", padding: "8px 24px", borderRadius: 8, cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AlarmOverlay() {
  const { alarmLevel, dismissAlarm } = useApp();
  return <AlarmController alarmLevel={alarmLevel as 0 | 1 | 2 | 3} onDismiss={dismissAlarm} />;
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppErrorBoundary>
          <Routes>
            <Route path="/alarm" element={<AlarmPage />} />
            <Route path="/widget" element={<Widget />} />
            <Route element={<AppShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/profiles" element={<Profiles />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
          <AlarmOverlay />
        </AppErrorBoundary>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
