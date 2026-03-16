use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct MonitorInfo {
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub scale_factor: f64,
    pub is_primary: bool,
}

#[tauri::command]
pub fn get_monitors(app: tauri::AppHandle) -> Result<Vec<MonitorInfo>, String> {
    let monitors = app
        .available_monitors()
        .map_err(|e| e.to_string())?;

    let primary = app.primary_monitor().map_err(|e| e.to_string())?;
    let primary_name = primary.as_ref().map(|m| m.name().cloned().unwrap_or_default());

    Ok(monitors
        .iter()
        .map(|m| {
            let name = m.name().cloned().unwrap_or_default();
            let size = m.size();
            let pos = m.position();
            MonitorInfo {
                is_primary: primary_name.as_deref() == Some(&name),
                name,
                width: size.width,
                height: size.height,
                x: pos.x,
                y: pos.y,
                scale_factor: m.scale_factor(),
            }
        })
        .collect())
}
