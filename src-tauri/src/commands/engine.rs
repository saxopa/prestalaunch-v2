use crate::services::docker::{self, DockerStatus};
use tauri::{Emitter, Window};

#[tauri::command]
pub async fn check_docker() -> Result<DockerStatus, String> {
    Ok(docker::check_docker_status().await)
}

#[tauri::command]
pub async fn start_docker(window: Window) -> Result<(), String> {
    let win = window.clone();
    docker::start_docker_daemon(move |progress| {
        let _ = win.emit("docker:progress", &progress);
    })
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn install_docker(window: Window) -> Result<(), String> {
    let win = window.clone();
    docker::install_docker(move |progress| {
        let _ = win.emit("docker:progress", &progress);
    })
    .await
    .map_err(|e| e.to_string())
}
