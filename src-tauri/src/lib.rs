mod commands;
mod models;
mod services;

use services::db::init_db;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

pub struct AppDataDir(pub PathBuf);
pub struct LogProcesses(pub Mutex<HashMap<String, u32>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data dir");

            let pool = tauri::async_runtime::block_on(async {
                init_db(app_data_dir.clone())
                    .await
                    .expect("Failed to initialize database")
            });

            app.manage(pool);
            app.manage(AppDataDir(app_data_dir));
            app.manage(LogProcesses(Mutex::new(HashMap::new())));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::app::get_onboarding_done,
            commands::app::set_onboarding_done,
            commands::engine::check_docker,
            commands::engine::start_docker,
            commands::engine::install_docker,
            commands::sites::list_sites,
            commands::sites::list_templates,
            commands::sites::create_site,
            commands::sites::delete_site,
            commands::sites::start_site,
            commands::sites::stop_site,
            commands::sites::get_site_status,
            commands::sites::open_site_folder,
            commands::sites::stream_site_logs,
            commands::sites::stop_site_logs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
