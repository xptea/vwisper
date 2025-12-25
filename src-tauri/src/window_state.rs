use tauri::Manager;

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HWND;
#[cfg(target_os = "windows")]
use windows::Win32::System::ProcessStatus::GetModuleBaseNameW;
#[cfg(target_os = "windows")]
use windows::Win32::System::Threading::{OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_VM_READ};
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::GetWindowThreadProcessId;

#[tauri::command]
pub fn get_active_window(app_handle: tauri::AppHandle) -> Option<isize> {
    use std::sync::{Arc, Mutex};
    let window_state: tauri::State<Arc<Mutex<Option<isize>>>> = app_handle.state();
    let window = window_state.lock().unwrap();
    *window
}

#[tauri::command]
pub fn get_active_window_name(app_handle: tauri::AppHandle) -> Option<String> {
    use std::sync::{Arc, Mutex};
    let window_state: tauri::State<Arc<Mutex<Option<isize>>>> = app_handle.state();
    let hwnd_opt = window_state.lock().unwrap();

    #[cfg(target_os = "windows")]
    if let Some(hwnd_val) = *hwnd_opt {
        let hwnd = HWND(hwnd_val as *mut std::ffi::c_void);

        // Get the process ID from the window handle
        let mut process_id: u32 = 0;
        unsafe { GetWindowThreadProcessId(hwnd, Some(&mut process_id)) };

        if process_id != 0 {
            // Open the process to get its name
            let process_handle = unsafe {
                OpenProcess(
                    PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
                    false,
                    process_id,
                )
            };

            if let Ok(handle) = process_handle {
                let mut buffer: [u16; 256] = [0; 256];
                let len = unsafe { GetModuleBaseNameW(handle, None, &mut buffer) };

                // Close the handle
                let _ = unsafe { windows::Win32::Foundation::CloseHandle(handle) };

                if len > 0 {
                    let exe_name = String::from_utf16_lossy(&buffer[..len as usize]);
                    // Remove .exe extension for cleaner display
                    let app_name = exe_name.trim_end_matches(".exe").trim_end_matches(".EXE");
                    return Some(app_name.to_string());
                }
            }
        }
    }

    None
}
