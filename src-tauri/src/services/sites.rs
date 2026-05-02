use std::path::PathBuf;
use tokio::process::Command;
use crate::models::site::Site;
use super::compose;

pub async fn create_site_files(app_data_dir: &PathBuf, site: &Site) -> Result<(), String> {
    let dir = compose::site_dir(app_data_dir, &site.id);
    tokio::fs::create_dir_all(dir.join("mysql"))
        .await
        .map_err(|e| format!("create dir mysql: {}", e))?;
    tokio::fs::create_dir_all(dir.join("prestashop"))
        .await
        .map_err(|e| format!("create dir prestashop: {}", e))?;

    let content = compose::generate_compose(
        &site.id,
        &site.domain,
        &site.ps_version,
        &site.mysql_version,
        site.port,
        site.pma_port,
    );
    tokio::fs::write(dir.join("docker-compose.yml"), content)
        .await
        .map_err(|e| format!("write compose: {}", e))?;

    Ok(())
}

pub async fn delete_site_files(app_data_dir: &PathBuf, site_id: &str) -> Result<(), String> {
    let dir = compose::site_dir(app_data_dir, site_id);
    if dir.exists() {
        tokio::fs::remove_dir_all(&dir)
            .await
            .map_err(|e| format!("remove dir: {}", e))?;
    }
    Ok(())
}

pub async fn start_site(app_data_dir: &PathBuf, site_id: &str) -> Result<(), String> {
    let dir = compose::site_dir(app_data_dir, site_id);
    let output = Command::new("docker")
        .args(["compose", "up", "-d"])
        .current_dir(&dir)
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    Ok(())
}

pub async fn stop_site(app_data_dir: &PathBuf, site_id: &str) -> Result<(), String> {
    let dir = compose::site_dir(app_data_dir, site_id);
    let output = Command::new("docker")
        .args(["compose", "down"])
        .current_dir(&dir)
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    Ok(())
}

pub async fn get_container_status(site_id: &str) -> String {
    let container = format!("pl_{}_ps", site_id);
    let output = Command::new("docker")
        .args(["inspect", "--format", "{{.State.Status}}", &container])
        .output()
        .await;

    match output {
        Err(_) => "stopped".to_string(),
        Ok(out) if !out.status.success() => "stopped".to_string(),
        Ok(out) => {
            match String::from_utf8_lossy(&out.stdout).trim() {
                "running" => "running".to_string(),
                "restarting" | "paused" => "starting".to_string(),
                _ => "stopped".to_string(),
            }
        }
    }
}
