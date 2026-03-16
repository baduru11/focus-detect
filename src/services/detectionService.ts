import { invoke } from "@tauri-apps/api/core";

export interface ActiveWindowInfo {
  title: string;
  process_name: string;
  app_name: string;
}

export interface MonitorInfo {
  id: string;
  name: string;
  width: number;
  height: number;
  is_primary: boolean;
}

export async function getActiveWindowInfo(): Promise<ActiveWindowInfo> {
  return invoke<ActiveWindowInfo>("get_active_window_info");
}

export async function getMonitors(): Promise<MonitorInfo[]> {
  return invoke<MonitorInfo[]>("get_monitors");
}

export interface RunningApp {
  process_name: string;
  app_name: string;
}

export async function listRunningApps(): Promise<RunningApp[]> {
  return invoke<RunningApp[]>("list_running_apps");
}
