use tokio::process::Command;

pub async fn add_host_entry(domain: &str) -> Result<(), String> {
    if entry_exists(domain)? {
        return Ok(());
    }

    let line = format!("127.0.0.1 {} # prestalaunch", domain);

    #[cfg(target_os = "macos")]
    {
        let script = format!(
            "do shell script \"echo '{}' >> /etc/hosts\" with administrator privileges",
            line
        );
        run_osascript(&script).await?;
    }

    #[cfg(target_os = "windows")]
    {
        let cmd = format!(
            "Add-Content -Path \"$env:windir\\System32\\drivers\\etc\\hosts\" -Value '{}'",
            line
        );
        run_elevated_ps(&cmd).await?;
    }

    Ok(())
}

pub async fn remove_host_entry(domain: &str) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        let script = format!(
            "do shell script \"grep -v ' {d} ' /etc/hosts | grep -v ' {d}$' > /tmp/pl_hosts_tmp && cp /tmp/pl_hosts_tmp /etc/hosts && rm /tmp/pl_hosts_tmp\" with administrator privileges",
            d = domain
        );
        run_osascript(&script).await?;
    }

    #[cfg(target_os = "windows")]
    {
        let cmd = format!(
            "(Get-Content \"$env:windir\\System32\\drivers\\etc\\hosts\") | Where-Object {{$_ -notmatch '{}'}} | Set-Content \"$env:windir\\System32\\drivers\\etc\\hosts\"",
            domain
        );
        run_elevated_ps(&cmd).await?;
    }

    Ok(())
}

fn entry_exists(domain: &str) -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    let path = "/etc/hosts";
    #[cfg(target_os = "windows")]
    let path = r"C:\Windows\System32\drivers\etc\hosts";

    let content =
        std::fs::read_to_string(path).map_err(|e| format!("Lecture /etc/hosts: {}", e))?;

    Ok(content
        .lines()
        .filter(|l| !l.starts_with('#'))
        .any(|l| l.split_whitespace().any(|w| w == domain)))
}

#[cfg(target_os = "macos")]
async fn run_osascript(script: &str) -> Result<(), String> {
    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let err = String::from_utf8_lossy(&output.stderr).to_string();
        if err.contains("-128") {
            return Err("Autorisation refusée par l'utilisateur.".to_string());
        }
        return Err(err);
    }
    Ok(())
}

#[cfg(target_os = "windows")]
async fn run_elevated_ps(cmd: &str) -> Result<(), String> {
    let full_cmd = format!(
        "Start-Process powershell -Verb RunAs -ArgumentList '-Command \"{}\"' -Wait",
        cmd
    );
    let output = Command::new("powershell")
        .args(["-Command", &full_cmd])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    Ok(())
}
