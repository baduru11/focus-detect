use active_win_pos_rs::get_active_window;
use base64::Engine;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::io::Cursor;
use xcap::Monitor;

#[derive(Serialize, Deserialize, Clone)]
pub struct ActiveWindowInfo {
    pub title: String,
    pub process_name: String,
    pub app_name: String,
}

#[tauri::command]
pub fn get_active_window_info() -> Result<ActiveWindowInfo, String> {
    match get_active_window() {
        Ok(window) => Ok(ActiveWindowInfo {
            title: window.title,
            process_name: window
                .process_path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_default(),
            app_name: window.app_name,
        }),
        Err(()) => Err("Failed to get active window".to_string()),
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct RunningApp {
    pub process_name: String,
    pub app_name: String,
}

#[tauri::command]
pub async fn list_running_apps() -> Result<Vec<RunningApp>, String> {
    tokio::task::spawn_blocking(|| {
        let output = std::process::Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object ProcessName, MainWindowTitle -Unique | ConvertTo-Json",
            ])
            .output()
            .map_err(|e| format!("Failed to list processes: {e}"))?;

        let json_str = String::from_utf8_lossy(&output.stdout);

        #[derive(Deserialize)]
        #[allow(non_snake_case)]
        struct PsProc {
            ProcessName: String,
            #[allow(dead_code)]
            MainWindowTitle: String,
        }

        // PowerShell returns single object (not array) if only 1 result
        let procs: Vec<PsProc> = if json_str.trim().starts_with('[') {
            serde_json::from_str(&json_str).unwrap_or_default()
        } else if let Ok(single) = serde_json::from_str::<PsProc>(&json_str) {
            vec![single]
        } else {
            vec![]
        };

        let mut seen = HashSet::new();
        let mut apps: Vec<RunningApp> = Vec::new();

        for p in procs {
            let name = format!("{}.exe", p.ProcessName);
            if seen.insert(name.clone()) {
                apps.push(RunningApp {
                    process_name: name,
                    app_name: p.ProcessName,
                });
            }
        }

        apps.sort_by(|a, b| a.app_name.to_lowercase().cmp(&b.app_name.to_lowercase()));
        Ok(apps)
    })
    .await
    .map_err(|e| format!("Task join error: {e}"))?
}

#[tauri::command]
pub async fn capture_screenshot() -> Result<String, String> {
    // Run the blocking screenshot capture on a separate thread
    tokio::task::spawn_blocking(|| {
        let monitors = Monitor::all().map_err(|e| format!("Failed to list monitors: {e}"))?;

        let monitor = monitors
            .into_iter()
            .find(|m| m.is_primary())
            .or_else(|| Monitor::all().ok().and_then(|m| m.into_iter().next()))
            .ok_or_else(|| "No monitors found".to_string())?;

        let image = monitor
            .capture_image()
            .map_err(|e| format!("Screenshot capture failed: {e}"))?;

        let mut png_bytes: Vec<u8> = Vec::new();
        image
            .write_to(&mut Cursor::new(&mut png_bytes), image::ImageFormat::Png)
            .map_err(|e| format!("PNG encoding failed: {e}"))?;

        Ok(base64::engine::general_purpose::STANDARD.encode(&png_bytes))
    })
    .await
    .map_err(|e| format!("Task join error: {e}"))?
}
