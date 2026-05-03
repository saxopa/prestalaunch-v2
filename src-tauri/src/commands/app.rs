use crate::{services::db, AppDataDir};
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn check_ssl_ca() -> Result<bool, String> {
    let mkcert = which::which("mkcert");
    if mkcert.is_err() {
        return Ok(false);
    }

    #[cfg(target_os = "macos")]
    {
        let out = tokio::process::Command::new("security")
            .args(["find-certificate", "-c", "mkcert"])
            .output()
            .await
            .map_err(|e| e.to_string())?;
        return Ok(out.status.success());
    }

    #[cfg(not(target_os = "macos"))]
    Ok(true)
}

#[tauri::command]
pub async fn install_ssl_ca() -> Result<(), String> {
    // Installe mkcert via Homebrew si absent
    if which::which("mkcert").is_err() {
        let brew = which::which("brew")
            .map_err(|_| "Homebrew introuvable. Installez Homebrew depuis https://brew.sh".to_string())?;

        let out = tokio::process::Command::new(&brew)
            .args(["install", "mkcert"])
            .output()
            .await
            .map_err(|e| format!("brew install mkcert : {e}"))?;

        if !out.status.success() {
            return Err(format!(
                "brew install mkcert échoué : {}",
                String::from_utf8_lossy(&out.stderr)
            ));
        }
    }

    let mkcert = which::which("mkcert")
        .map_err(|_| "mkcert introuvable après installation".to_string())?;

    // Installe la CA dans le trousseau (demande le mot de passe admin via dialog macOS)
    let out = tokio::process::Command::new(&mkcert)
        .arg("-install")
        .output()
        .await
        .map_err(|e| format!("mkcert -install : {e}"))?;

    if !out.status.success() {
        return Err(format!(
            "Installation CA échouée : {}",
            String::from_utf8_lossy(&out.stderr)
        ));
    }

    Ok(())
}

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

#[tauri::command]
pub async fn get_data_dir(data_dir: State<'_, AppDataDir>) -> Result<String, String> {
    Ok(data_dir.0.to_string_lossy().to_string())
}
