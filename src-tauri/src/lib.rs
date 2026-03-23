use tauri::Manager;

mod alarm_overlay;
mod detection;
mod monitors;
mod tray;

#[cfg(target_os = "windows")]
pub fn apply_vibrancy_effect(window: &tauri::WebviewWindow) {
    use window_vibrancy::apply_acrylic;

    // Acrylic = frosted glass blur. RGBA tint: dark base, partial transparency
    match apply_acrylic(window, Some((6, 6, 12, 248))) {
        Ok(_) => eprintln!("[vibrancy] Acrylic (frosted glass) applied"),
        Err(e) => eprintln!("[vibrancy] Acrylic failed: {e:?}"),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:focus_detector.db",
                    vec![tauri_plugin_sql::Migration {
                        version: 1,
                        description: "create initial tables",
                        sql: include_str!("../migrations/001_init.sql"),
                        kind: tauri_plugin_sql::MigrationKind::Up,
                    }],
                )
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            detection::get_active_window_info,
            detection::capture_screenshot,
            detection::list_running_apps,
            monitors::get_monitors,
            tray::update_tray_tooltip,
            tray::toggle_widget,
            tray::widget_open_main,
            alarm_overlay::show_alarm_overlay,
            alarm_overlay::hide_alarm_overlay,
        ])
        .setup(|app| {
            tray::setup_tray(app)?;

            // Set window icon from bundled icon
            if let Some(default_icon) = app.default_window_icon().cloned() {
                for (_label, window) in app.webview_windows() {
                    let _ = window.set_icon(default_icon.clone());
                }
            }

            if let Some(window) = app.get_webview_window("main") {
                #[cfg(target_os = "windows")]
                apply_vibrancy_effect(&window);
                let _ = window.show();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
