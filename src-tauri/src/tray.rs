use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Emitter, Manager, WebviewUrl, WebviewWindowBuilder,
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
                // Hide widget, show main window
                if let Some(widget) = app.get_webview_window("widget") {
                    let _ = widget.close();
                }
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

/// Create the small floating widget window (like Zoom mini-window)
pub fn create_widget_window(app: &tauri::AppHandle) -> Result<(), String> {
    // Don't create if already exists
    if app.get_webview_window("widget").is_some() {
        return Ok(());
    }

    let widget = WebviewWindowBuilder::new(
        app,
        "widget",
        WebviewUrl::App("/widget".into()),
    )
    .title("Focus Detector")
    .inner_size(340.0, 52.0)
    .min_inner_size(280.0, 48.0)
    .position(100.0, 100.0)
    .decorations(false)
    .transparent(true)
    .shadow(false)
    .always_on_top(true)
    .resizable(true)
    .skip_taskbar(false)
    .background_color(tauri::window::Color(0, 0, 0, 0))
    .build()
    .map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    crate::apply_vibrancy_effect(&widget);

    // Ensure always-on-top is set after creation
    let _ = widget.set_always_on_top(true);

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
    if visible {
        create_widget_window(&app)?;
    } else if let Some(widget) = app.get_webview_window("widget") {
        widget.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Called from widget: close widget, show main window
#[tauri::command]
pub async fn widget_open_main(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(widget) = app.get_webview_window("widget") {
        let _ = widget.close();
    }
    if let Some(main) = app.get_webview_window("main") {
        main.show().map_err(|e| e.to_string())?;
        main.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}
