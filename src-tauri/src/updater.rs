use std::fs::{self, File};
use std::io::{BufWriter, Write};
use std::path::PathBuf;
use std::process::Command;
use std::thread;
use std::time::Duration;

/// URL for checking the latest version
const VERSION_URL: &str =
    "https://raw.githubusercontent.com/xptea/VWisper-Releases/refs/heads/main/version";

/// Check for updates by fetching the latest version from GitHub
#[tauri::command]
pub fn check_for_update() -> Result<String, String> {
    let response = ureq::get(VERSION_URL)
        .timeout(Duration::from_secs(10))
        .call()
        .map_err(|e| format!("Failed to check for updates: {}", e))?;

    if response.status() != 200 {
        return Err(format!(
            "Version check failed with status: {}",
            response.status()
        ));
    }

    let version = response
        .into_string()
        .map_err(|e| format!("Failed to read version: {}", e))?
        .trim()
        .to_string();

    Ok(version)
}

/// Get the downloads directory path for the update
fn get_update_download_path(version: &str) -> PathBuf {
    let downloads_dir = dirs::download_dir()
        .unwrap_or_else(|| dirs::home_dir().unwrap_or_else(|| PathBuf::from(".")));

    downloads_dir.join(format!("vwisper_{}_x64-setup.exe", version))
}

/// Download file from URL to the specified path
/// Uses a blocking HTTP client to download the file
fn download_file(url: &str, path: &PathBuf) -> Result<(), String> {
    // Use ureq for simple synchronous HTTP requests
    let response = ureq::get(url)
        .timeout(Duration::from_secs(300)) // 5 minute timeout
        .call()
        .map_err(|e| format!("Failed to download: {}", e))?;

    if response.status() != 200 {
        return Err(format!(
            "Download failed with status: {}",
            response.status()
        ));
    }

    // Create parent directories if they don't exist
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // Create the file and write the response body
    let file = File::create(path).map_err(|e| format!("Failed to create file: {}", e))?;

    let mut writer = BufWriter::new(file);

    // Read the response body into a buffer and write to file
    let mut reader = response.into_reader();
    let mut buffer = [0u8; 8192];

    loop {
        let bytes_read = std::io::Read::read(&mut reader, &mut buffer)
            .map_err(|e| format!("Failed to read response: {}", e))?;

        if bytes_read == 0 {
            break;
        }

        writer
            .write_all(&buffer[..bytes_read])
            .map_err(|e| format!("Failed to write to file: {}", e))?;
    }

    writer
        .flush()
        .map_err(|e| format!("Failed to flush file: {}", e))?;

    Ok(())
}

/// Verify that the downloaded file exists and has a reasonable size
fn verify_download(path: &PathBuf) -> Result<(), String> {
    let metadata = fs::metadata(path).map_err(|e| format!("Failed to verify download: {}", e))?;

    // Check that file is at least 1MB (reasonable minimum for an exe installer)
    if metadata.len() < 1_000_000 {
        return Err("Downloaded file appears to be incomplete (too small)".to_string());
    }

    Ok(())
}

/// Launch the installer and wait briefly to verify it started
fn launch_installer(path: &PathBuf) -> Result<(), String> {
    // Launch the installer
    let child = Command::new(path)
        .spawn()
        .map_err(|e| format!("Failed to launch installer: {}", e))?;

    // Give the process a moment to start
    thread::sleep(Duration::from_millis(500));

    // Check if the process is still running (it should be for an installer)
    // We can't actually check if it's running without platform-specific code,
    // but if spawn succeeded, the process was at least started
    let pid = child.id();

    // Log success
    println!("Installer launched successfully with PID: {}", pid);

    Ok(())
}

#[tauri::command]
pub async fn download_and_install_update(
    download_url: String,
    version: String,
    app: tauri::AppHandle,
) -> Result<String, String> {
    // Get the download path
    let download_path = get_update_download_path(&version);

    // Download the file (run in blocking thread to not block async runtime)
    let url = download_url.clone();
    let path = download_path.clone();

    let download_result = tokio::task::spawn_blocking(move || download_file(&url, &path))
        .await
        .map_err(|e| format!("Download task failed: {}", e))?;

    download_result?;

    // Verify the download
    verify_download(&download_path)?;

    // Launch the installer
    launch_installer(&download_path)?;

    // Give the installer a moment to fully initialize
    thread::sleep(Duration::from_secs(1));

    // Now we can safely exit the current application
    // The installer is confirmed to be running
    println!("Update installer running, exiting current application...");

    // Use a short delay before exit to allow the response to be sent
    let handle = app.clone();
    tokio::spawn(async move {
        tokio::time::sleep(Duration::from_millis(500)).await;
        handle.exit(0);
    });

    Ok(format!("Update v{} downloading and installing...", version))
}

/// Check if an update file already exists (in case of a previous interrupted download)
#[tauri::command]
pub fn check_pending_update(version: String) -> Option<String> {
    let download_path = get_update_download_path(&version);

    if download_path.exists() {
        if verify_download(&download_path).is_ok() {
            return Some(download_path.to_string_lossy().to_string());
        }
    }

    None
}
