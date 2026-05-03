use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::process::Command;
use std::time::Duration;
use tokio::time::sleep;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DockerStatus {
    NotInstalled,
    InstalledNotRunning,
    Ready,
    Error(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallProgress {
    pub step: String,
    pub percent: u8,
    pub message: String,
}

pub fn check_docker_binary() -> bool {
    which::which("docker").is_ok()
}

pub fn docker_app_installed() -> bool {
    #[cfg(target_os = "macos")]
    return std::path::Path::new("/Applications/Docker.app").exists();

    #[cfg(target_os = "windows")]
    return std::path::Path::new(
        r"C:\Program Files\Docker\Docker\Docker Desktop.exe",
    )
    .exists();

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    return check_docker_binary();
}

pub async fn check_docker_status() -> DockerStatus {
    if !docker_app_installed() && !check_docker_binary() {
        return DockerStatus::NotInstalled;
    }

    // Try pinging the daemon
    let output = tokio::process::Command::new("docker")
        .args(["info", "--format", "{{.ServerVersion}}"])
        .output()
        .await;

    match output {
        Ok(o) if o.status.success() => DockerStatus::Ready,
        Ok(_) => DockerStatus::InstalledNotRunning,
        Err(e) => {
            if docker_app_installed() {
                DockerStatus::InstalledNotRunning
            } else {
                DockerStatus::Error(e.to_string())
            }
        }
    }
}

pub async fn start_docker_daemon<F>(on_progress: F) -> Result<()>
where
    F: Fn(InstallProgress) + Send + 'static,
{
    on_progress(InstallProgress {
        step: "starting".into(),
        percent: 10,
        message: "Démarrage de Docker…".into(),
    });

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-a")
            .arg("Docker")
            .spawn()
            .context("Impossible de démarrer Docker Desktop")?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .args(["/C", "start", "", r"C:\Program Files\Docker\Docker\Docker Desktop.exe"])
            .spawn()
            .context("Impossible de démarrer Docker Desktop")?;
    }

    // Attendre que le daemon soit prêt (max 60s)
    for i in 0..30 {
        sleep(Duration::from_secs(2)).await;
        let pct = 10 + (i * 3).min(85) as u8;
        on_progress(InstallProgress {
            step: "waiting".into(),
            percent: pct,
            message: format!("Attente du daemon Docker… ({}/30)", i + 1),
        });

        let output = tokio::process::Command::new("docker")
            .args(["info"])
            .output()
            .await;

        if matches!(output, Ok(o) if o.status.success()) {
            on_progress(InstallProgress {
                step: "ready".into(),
                percent: 100,
                message: "Docker est prêt !".into(),
            });
            return Ok(());
        }
    }

    anyhow::bail!("Docker n'a pas démarré dans les temps (60s). Lancez Docker manuellement.")
}

pub async fn install_docker<F>(on_progress: F) -> Result<()>
where
    F: Fn(InstallProgress) + Send + Sync + 'static,
{
    use futures_util::StreamExt;
    use tokio::fs;

    on_progress(InstallProgress {
        step: "download_start".into(),
        percent: 0,
        message: "Téléchargement de Docker Desktop…".into(),
    });

    let (url, filename) = get_docker_download_url();
    let tmp_path = std::env::temp_dir().join(&filename);

    // Download avec progression
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .context("Erreur de téléchargement Docker")?;

    let total = response.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut file = tokio::fs::File::create(&tmp_path).await?;
    let mut stream = response.bytes_stream();

    use tokio::io::AsyncWriteExt;
    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        file.write_all(&chunk).await?;
        downloaded += chunk.len() as u64;
        if total > 0 {
            let pct = ((downloaded as f64 / total as f64) * 70.0) as u8;
            on_progress(InstallProgress {
                step: "downloading".into(),
                percent: pct,
                message: format!(
                    "Téléchargement… {:.0}/{:.0} MB",
                    downloaded as f64 / 1_048_576.0,
                    total as f64 / 1_048_576.0
                ),
            });
        }
    }

    on_progress(InstallProgress {
        step: "installing".into(),
        percent: 72,
        message: "Installation de Docker Desktop…".into(),
    });

    run_installer(&tmp_path).await?;

    // Nettoyage fichier temporaire
    let _ = fs::remove_file(&tmp_path).await;

    on_progress(InstallProgress {
        step: "launching".into(),
        percent: 85,
        message: "Lancement de Docker…".into(),
    });

    // Attendre daemon prêt
    let on_progress_arc = std::sync::Arc::new(on_progress);
    for i in 0..30 {
        sleep(Duration::from_secs(2)).await;
        let pct = 85 + (i as u8).min(14);
        on_progress_arc(InstallProgress {
            step: "waiting".into(),
            percent: pct,
            message: format!("Attente du daemon… ({}/30)", i + 1),
        });

        let output = tokio::process::Command::new("docker")
            .args(["info"])
            .output()
            .await;

        if matches!(output, Ok(o) if o.status.success()) {
            on_progress_arc(InstallProgress {
                step: "ready".into(),
                percent: 100,
                message: "Docker est prêt !".into(),
            });
            return Ok(());
        }
    }

    anyhow::bail!("Docker installé mais daemon non démarré. Relancez Docker manuellement.")
}

fn get_docker_download_url() -> (String, String) {
    #[cfg(target_os = "macos")]
    {
        let arch = if cfg!(target_arch = "aarch64") {
            "arm64"
        } else {
            "amd64"
        };
        (
            format!("https://desktop.docker.com/mac/main/{}/Docker.dmg", arch),
            "Docker.dmg".into(),
        )
    }

    #[cfg(target_os = "windows")]
    {
        (
            "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe".into(),
            "DockerDesktopInstaller.exe".into(),
        )
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        ("".into(), "".into())
    }
}

async fn run_installer(path: &std::path::Path) -> Result<()> {
    #[cfg(target_os = "macos")]
    {
        // Mount DMG
        let mount = tokio::process::Command::new("hdiutil")
            .args(["attach", "-nobrowse", "-quiet", path.to_str().unwrap()])
            .output()
            .await?;

        if !mount.status.success() {
            anyhow::bail!("Impossible de monter le DMG Docker");
        }

        // Copy Docker.app to /Applications (nécessite droits admin)
        let copy = tokio::process::Command::new("osascript")
            .args(["-e", "do shell script \"cp -R /Volumes/Docker/Docker.app /Applications/Docker.app\" with administrator privileges"])
            .output()
            .await
            .context("Copie Docker.app échouée")?;
        if !copy.status.success() {
            let _ = tokio::process::Command::new("hdiutil")
                .args(["detach", "/Volumes/Docker", "-quiet", "-force"])
                .output().await;
            anyhow::bail!("Copie de Docker.app annulée ou refusée");
        }

        // Detach DMG
        let _ = tokio::process::Command::new("hdiutil")
            .args(["detach", "/Volumes/Docker", "-quiet", "-force"])
            .output()
            .await;

        // Launch
        Command::new("open")
            .arg("-a")
            .arg("Docker")
            .spawn()
            .context("Impossible de lancer Docker")?;
    }

    #[cfg(target_os = "windows")]
    {
        let status = tokio::process::Command::new(path)
            .args(["install", "--quiet", "--accept-license"])
            .status()
            .await
            .context("Erreur installation Docker")?;

        if !status.success() {
            anyhow::bail!("L'installeur Docker a retourné une erreur");
        }
    }

    Ok(())
}
