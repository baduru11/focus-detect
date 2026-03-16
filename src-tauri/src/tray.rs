use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Emitter, Manager,
};

pub fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItemBuilder::with_id("show", "Show Window").build(app)?;
    let start = MenuItemBuilder::with_id("start", "Start Focus").build(app)?;
    let pause = MenuItemBuilder::with_id("pause", "Pause").build(app)?;
    let stop = MenuItemBuilder::with_id("stop", "Stop").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = MenuBuilder::new(app)
        .items(&[&show, &start, &pause, &stop, &quit])
        .build()?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("Focus Detector")
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "start" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("tray-action", "start");
                }
            }
            "pause" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("tray-action", "pause");
                }
            }
            "stop" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.emit("tray-action", "stop");
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}

#[tauri::command]
pub async fn update_tray_tooltip(
    app: tauri::AppHandle,
    text: String,
) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main") {
        tray.set_tooltip(Some(&text)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn toggle_widget(app: tauri::AppHandle, visible: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("widget") {
        if visible {
            window.show().map_err(|e| e.to_string())?;
        } else {
            window.hide().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}
