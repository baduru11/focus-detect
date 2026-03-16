use tauri::Manager;

mod alarm_overlay;
mod detection;
mod monitors;
mod tray;

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
            alarm_overlay::show_alarm_overlay,
            alarm_overlay::hide_alarm_overlay,
        ])
        .setup(|app| {
            tray::setup_tray(app)?;
            // Hide main window initially and show after setup
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
