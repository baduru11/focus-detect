use std::fs;
use tauri::Manager;

#[tauri::command]
pub async fn list_custom_memes(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let memes_dir = app_data.join("memes").join("custom");

    // Create directory if it doesn't exist
    if !memes_dir.exists() {
        fs::create_dir_all(&memes_dir).map_err(|e| e.to_string())?;
    }

    let mut files = Vec::new();
    let entries = fs::read_dir(&memes_dir).map_err(|e| e.to_string())?;

    let valid_extensions = ["png", "jpg", "jpeg", "gif", "webp"];
    let mut count = 0;

    for entry in entries {
        if count >= 100 {
            break;
        } // Limit to 100 files
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_file() {
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                if valid_extensions.contains(&ext.to_lowercase().as_str()) {
                    // Convert to asset protocol URL
                    if let Some(path_str) = path.to_str() {
                        files.push(format!(
                            "asset://localhost/{}",
                            path_str.replace('\\', "/")
                        ));
                        count += 1;
                    }
                }
            }
        }
    }

    Ok(files)
}
