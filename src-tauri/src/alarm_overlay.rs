use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
pub async fn show_alarm_overlay(app: tauri::AppHandle) -> Result<(), String> {
    // Close existing overlay if any
    if let Some(existing) = app.get_webview_window("alarm-overlay") {
        let _ = existing.close();
    }

    // Get primary monitor dimensions
    let monitor = app
        .primary_monitor()
        .map_err(|e| e.to_string())?
        .ok_or("No primary monitor")?;

    let size = monitor.size();
    let pos = monitor.position();

    // Create a fullscreen transparent overlay window
    let _overlay = WebviewWindowBuilder::new(
        &app,
        "alarm-overlay",
        WebviewUrl::App("/alarm".into()),
    )
    .title("")
    .inner_size(size.width as f64, size.height as f64)
    .position(pos.x as f64, pos.y as f64)
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .resizable(false)
    .focused(false)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn hide_alarm_overlay(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(overlay) = app.get_webview_window("alarm-overlay") {
        overlay.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}
