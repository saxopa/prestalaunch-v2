use crate::services::db;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn get_onboarding_done(pool: State<'_, SqlitePool>) -> Result<bool, String> {
    let val = db::get_setting(&pool, "onboarding_done")
        .await
        .map_err(|e| e.to_string())?;
    Ok(val.as_deref() == Some("true"))
}

#[tauri::command]
pub async fn set_onboarding_done(pool: State<'_, SqlitePool>) -> Result<(), String> {
    db::set_setting(&pool, "onboarding_done", "true")
        .await
        .map_err(|e| e.to_string())
}
