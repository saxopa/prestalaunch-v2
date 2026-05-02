use crate::models::site::{CreateSiteInput, Site, SiteTemplate};
use crate::services::{compose, hosts, sites as site_svc};
use crate::{AppDataDir, LogProcesses};
use chrono::Utc;
use sqlx::SqlitePool;
use tauri::{Emitter, State, Window};
use uuid::Uuid;

#[tauri::command]
pub async fn list_sites(pool: State<'_, SqlitePool>) -> Result<Vec<Site>, String> {
    sqlx::query_as::<_, Site>("SELECT * FROM sites ORDER BY created_at DESC")
        .fetch_all(&*pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_templates(pool: State<'_, SqlitePool>) -> Result<Vec<SiteTemplate>, String> {
    sqlx::query_as::<_, SiteTemplate>(
        "SELECT * FROM templates ORDER BY is_default DESC, name ASC",
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_site(
    input: CreateSiteInput,
    pool: State<'_, SqlitePool>,
    data_dir: State<'_, AppDataDir>,
) -> Result<Site, String> {
    let (port, pma_port, ssl_port) = compose::find_free_ports(&pool).await?;
    let site = Site {
        id: Uuid::new_v4().to_string(),
        name: input.name,
        domain: input.domain,
        ps_version: input.ps_version,
        php_version: input.php_version,
        mysql_version: input.mysql_version,
        port,
        pma_port,
        ssl_port: Some(ssl_port),
        status: "stopped".to_string(),
        created_at: Utc::now().to_rfc3339(),
    };

    hosts::add_host_entry(&site.domain)
        .await
        .map_err(|e| format!("hosts: {}", e))?;

    site_svc::create_site_files(&data_dir.0, &site)
        .await
        .map_err(|e| format!("files: {}", e))?;

    sqlx::query(
        "INSERT INTO sites (id, name, domain, ps_version, php_version, mysql_version, port, pma_port, ssl_port, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&site.id)
    .bind(&site.name)
    .bind(&site.domain)
    .bind(&site.ps_version)
    .bind(&site.php_version)
    .bind(&site.mysql_version)
    .bind(site.port)
    .bind(site.pma_port)
    .bind(site.ssl_port)
    .bind(&site.status)
    .bind(&site.created_at)
    .execute(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(site)
}

#[tauri::command]
pub async fn delete_site(
    site_id: String,
    pool: State<'_, SqlitePool>,
    data_dir: State<'_, AppDataDir>,
) -> Result<(), String> {
    let site = sqlx::query_as::<_, Site>("SELECT * FROM sites WHERE id = ?")
        .bind(&site_id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    let _ = site_svc::stop_site(&data_dir.0, &site_id).await;
    let _ = hosts::remove_host_entry(&site.domain).await;

    site_svc::delete_site_files(&data_dir.0, &site_id)
        .await
        .map_err(|e| format!("files: {}", e))?;

    sqlx::query("DELETE FROM sites WHERE id = ?")
        .bind(&site_id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn start_site(
    site_id: String,
    pool: State<'_, SqlitePool>,
    data_dir: State<'_, AppDataDir>,
) -> Result<(), String> {
    sqlx::query("UPDATE sites SET status = 'starting' WHERE id = ?")
        .bind(&site_id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    site_svc::start_site(&data_dir.0, &site_id)
        .await
        .map_err(|e| {
            let pool = pool.inner().clone();
            let id = site_id.clone();
            tokio::spawn(async move {
                let _ = sqlx::query("UPDATE sites SET status = 'error' WHERE id = ?")
                    .bind(&id)
                    .execute(&pool)
                    .await;
            });
            e
        })?;

    sqlx::query("UPDATE sites SET status = 'running' WHERE id = ?")
        .bind(&site_id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn stop_site(
    site_id: String,
    pool: State<'_, SqlitePool>,
    data_dir: State<'_, AppDataDir>,
) -> Result<(), String> {
    site_svc::stop_site(&data_dir.0, &site_id).await?;

    sqlx::query("UPDATE sites SET status = 'stopped' WHERE id = ?")
        .bind(&site_id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_site_status(
    site_id: String,
    pool: State<'_, SqlitePool>,
) -> Result<String, String> {
    let status = site_svc::get_container_status(&site_id).await;

    sqlx::query("UPDATE sites SET status = ? WHERE id = ?")
        .bind(&status)
        .bind(&site_id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(status)
}

#[tauri::command]
pub async fn open_site_folder(
    site_id: String,
    app: String,
    data_dir: State<'_, AppDataDir>,
) -> Result<(), String> {
    let path = compose::site_dir(&data_dir.0, &site_id).join("prestashop");

    match app.as_str() {
        "finder" => {
            std::process::Command::new("open")
                .arg(&path)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        "vscode" => {
            std::process::Command::new("code")
                .arg(&path)
                .spawn()
                .map_err(|e| format!("VS Code introuvable (installez la commande 'code' depuis VS Code → Shell Command): {}", e))?;
        }
        "terminal" => {
            std::process::Command::new("open")
                .args(["-a", "Terminal", path.to_str().unwrap_or("")])
                .spawn()
                .map_err(|e| e.to_string())?;
        }
        _ => return Err(format!("App inconnue: {}", app)),
    }

    Ok(())
}

#[tauri::command]
pub async fn stream_site_logs(
    site_id: String,
    window: Window,
    data_dir: State<'_, AppDataDir>,
    log_procs: State<'_, LogProcesses>,
) -> Result<(), String> {
    use tokio::io::{AsyncBufReadExt, BufReader};

    // Tuer stream précédent si actif
    {
        let pid = log_procs.0.lock().unwrap().remove(&site_id);
        if let Some(pid) = pid {
            let _ = std::process::Command::new("kill")
                .args(["-TERM", &pid.to_string()])
                .output();
        }
    }

    let dir = compose::site_dir(&data_dir.0, &site_id);
    let event_name = format!("site:log:{}", site_id);

    let mut child = tokio::process::Command::new("docker")
        .args(["compose", "logs", "-f", "--tail=100"])
        .current_dir(dir)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::null())
        .spawn()
        .map_err(|e| e.to_string())?;

    if let Some(pid) = child.id() {
        log_procs.0.lock().unwrap().insert(site_id, pid);
    }

    tokio::spawn(async move {
        if let Some(stdout) = child.stdout.take() {
            let mut lines = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = lines.next_line().await {
                let _ = window.emit(&event_name, line);
            }
        }
        let _ = child.wait().await;
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_site_logs(
    site_id: String,
    log_procs: State<'_, LogProcesses>,
) -> Result<(), String> {
    let pid = log_procs.0.lock().unwrap().remove(&site_id);
    if let Some(pid) = pid {
        let _ = std::process::Command::new("kill")
            .args(["-TERM", &pid.to_string()])
            .output();
    }
    Ok(())
}

#[tauri::command]
pub async fn enable_ssl(
    site_id: String,
    pool: State<'_, SqlitePool>,
    data_dir: State<'_, AppDataDir>,
) -> Result<Site, String> {
    // Vérifier mkcert installé
    let mkcert_path = which::which("mkcert")
        .map_err(|_| "mkcert introuvable. Installez-le : brew install mkcert && mkcert -install".to_string())?;

    let site = sqlx::query_as::<_, Site>("SELECT * FROM sites WHERE id = ?")
        .bind(&site_id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    // Allouer ssl_port si pas encore fait (sites existants avant migration)
    let ssl_port = if let Some(p) = site.ssl_port {
        p
    } else {
        let (_, _, p) = compose::find_free_ports(&pool).await?;
        sqlx::query("UPDATE sites SET ssl_port = ? WHERE id = ?")
            .bind(p)
            .bind(&site_id)
            .execute(&*pool)
            .await
            .map_err(|e| e.to_string())?;
        p
    };

    let dir = compose::site_dir(&data_dir.0, &site_id);
    let certs_dir = dir.join("certs");
    tokio::fs::create_dir_all(&certs_dir)
        .await
        .map_err(|e| e.to_string())?;

    // Générer certificat
    let cert_path = certs_dir.join("cert.pem");
    let key_path = certs_dir.join("key.pem");
    let output = tokio::process::Command::new(&mkcert_path)
        .args([
            "-cert-file", cert_path.to_str().unwrap(),
            "-key-file",  key_path.to_str().unwrap(),
            &site.domain,
        ])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(format!(
            "mkcert échoué: {}. Avez-vous exécuté `mkcert -install` ?",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    // Écrire nginx.conf
    let nginx_conf = compose::generate_nginx_conf(&site.domain);
    tokio::fs::write(dir.join("nginx.conf"), nginx_conf)
        .await
        .map_err(|e| e.to_string())?;

    // Réécrire docker-compose avec nginx
    let compose_content = compose::generate_compose(
        &site_id, &site.domain, &site.ps_version,
        &site.mysql_version, site.port, site.pma_port, Some(ssl_port),
    );
    tokio::fs::write(dir.join("docker-compose.yml"), compose_content)
        .await
        .map_err(|e| e.to_string())?;

    // Marquer SSL actif (ssl_port != NULL = SSL activé)
    sqlx::query("UPDATE sites SET ssl_port = ? WHERE id = ?")
        .bind(ssl_port)
        .bind(&site_id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    // Appliquer si le site tourne
    if site.status == "running" {
        let _ = tokio::process::Command::new("docker")
            .args(["compose", "up", "-d", "--no-recreate"])
            .current_dir(&dir)
            .output()
            .await;
    }

    let updated = sqlx::query_as::<_, Site>("SELECT * FROM sites WHERE id = ?")
        .bind(&site_id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(updated)
}

#[tauri::command]
pub async fn disable_ssl(
    site_id: String,
    pool: State<'_, SqlitePool>,
    data_dir: State<'_, AppDataDir>,
) -> Result<Site, String> {
    let site = sqlx::query_as::<_, Site>("SELECT * FROM sites WHERE id = ?")
        .bind(&site_id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    let dir = compose::site_dir(&data_dir.0, &site_id);

    // Réécrire docker-compose sans nginx (mais garder ssl_port alloué)
    let compose_content = compose::generate_compose(
        &site_id, &site.domain, &site.ps_version,
        &site.mysql_version, site.port, site.pma_port, None,
    );
    tokio::fs::write(dir.join("docker-compose.yml"), compose_content)
        .await
        .map_err(|e| e.to_string())?;

    // Stopper le container nginx
    if site.status == "running" {
        let _ = tokio::process::Command::new("docker")
            .args(["compose", "stop", "nginx"])
            .current_dir(&dir)
            .output()
            .await;
        let _ = tokio::process::Command::new("docker")
            .args(["compose", "rm", "-f", "nginx"])
            .current_dir(&dir)
            .output()
            .await;
    }

    // Marquer SSL inactif en mettant ssl_port à NULL
    sqlx::query("UPDATE sites SET ssl_port = NULL WHERE id = ?")
        .bind(&site_id)
        .execute(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    let updated = sqlx::query_as::<_, Site>("SELECT * FROM sites WHERE id = ?")
        .bind(&site_id)
        .fetch_one(&*pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(updated)
}
