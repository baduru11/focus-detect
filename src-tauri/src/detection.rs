use active_win_pos_rs::get_active_window;
use serde::{Deserialize, Serialize};

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
