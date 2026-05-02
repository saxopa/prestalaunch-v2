mod commands;
mod models;
mod services;

use services::db::init_db;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data dir");

            tauri::async_runtime::block_on(async move {
                let pool = init_db(app_data_dir)
                    .await
                    .expect("Failed to initialize database");
                app.manage(pool);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::app::get_onboarding_done,
            commands::app::set_onboarding_done,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
