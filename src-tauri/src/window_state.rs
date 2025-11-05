use tauri::Manager;

#[tauri::command]
pub fn get_active_window(app_handle: tauri::AppHandle) -> Option<isize> {
    use std::sync::{Arc, Mutex};
    let window_state: tauri::State<Arc<Mutex<Option<isize>>>> = app_handle.state();
    let window = window_state.lock().unwrap();
    *window
}