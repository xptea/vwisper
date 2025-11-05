
#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HWND;
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::SetForegroundWindow;
use std::process::Command;
use std::env;

#[tauri::command]
pub async fn type_text(text: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        type_text_windows(&text).map_err(|e| format!("Failed to type text: {}", e))
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Text typing is only supported on Windows".to_string())
    }
}

#[cfg(target_os = "windows")]
fn type_text_windows(text: &str) -> Result<(), Box<dyn std::error::Error>> {
    let exe_path = env::current_exe()?;
    let injector_path = exe_path.parent().unwrap().join("text_injector");
    Command::new(injector_path).arg(text).spawn()?;
    Ok(())
}

#[tauri::command]
pub async fn restore_window_focus(hwnd: isize) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        unsafe {
            let hwnd = HWND(hwnd as *mut std::ffi::c_void);
            let _ = SetForegroundWindow(hwnd);
        }
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Window focus restoration is only supported on Windows".to_string())
    }
}