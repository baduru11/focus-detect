use active_win_pos_rs::get_active_window;
use base64::Engine;
use serde::{Deserialize, Serialize};
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
