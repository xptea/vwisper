use std::thread;
use std::time::{Duration, Instant};
use device_query::{DeviceState, Keycode, DeviceQuery};
use tauri::{AppHandle, Manager, Emitter};
use crate::audio;

#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, SetForegroundWindow};
#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HWND;

use crate::TypingState;

pub fn start_global_key_monitor(app_handle: AppHandle) {
    use std::sync::{Arc, Mutex};
    let listening_state = Arc::new(Mutex::new(false));
    let active_window = Arc::new(Mutex::new(None::<isize>));
    let app_handle_for_thread = app_handle.clone();
    let listening_state_for_thread = listening_state.clone();
    let active_window_for_thread = active_window.clone();
    thread::spawn(move || {
        let device_state = DeviceState::new();
        let mut last_control_state = false;
        let mut last_action_time = Instant::now();
        let mut active_window_handle: Option<HWND> = None;
        let mut hold_start_time: Option<Instant> = None;

        loop {
            let keys = device_state.get_keys();
            let is_typing = if let Some(state) = app_handle_for_thread.try_state::<TypingState>() {
                *state.0.lock().unwrap()
            } else {
                false
            };
            let control_pressed = keys.contains(&Keycode::RControl) || is_typing;
            let now = Instant::now();

            if control_pressed && !last_control_state && now.duration_since(last_action_time) > Duration::from_millis(25) {
                last_action_time = now;
                hold_start_time = Some(now);
                #[cfg(target_os = "windows")]
                {
                    active_window_handle = Some(unsafe { GetForegroundWindow() });
                    let mut window_state = active_window_for_thread.lock().unwrap();
                    *window_state = active_window_handle.map(|hwnd| hwnd.0 as isize);
                }
                if let Some(window) = app_handle_for_thread.get_webview_window("voice") {
                    let _ = window.show();
                    #[cfg(target_os = "windows")]
                    if let Some(hwnd) = active_window_handle {
                        thread::sleep(Duration::from_millis(100));
                        unsafe {
                            let _ = SetForegroundWindow(hwnd);
                        }
                    }
                }
                let _ = app_handle_for_thread.emit_to("voice", "start-listening", "");
                audio::play_start_sound();
                let mut state = listening_state_for_thread.lock().unwrap();
                *state = true;
            }

            if !control_pressed && last_control_state && now.duration_since(last_action_time) > Duration::from_millis(25) {
                last_action_time = now;
                let hold_time_ms = hold_start_time.map(|start| start.elapsed().as_millis() as u64);
                thread::sleep(Duration::from_millis(100));
                #[cfg(target_os = "windows")]
                if let Some(hwnd) = active_window_handle {
                    unsafe {
                        let _ = SetForegroundWindow(hwnd);
                    }
                }
                let _ = app_handle_for_thread.emit_to("voice", "stop-listening", "");
                audio::play_end_sound();
                let mut state = listening_state_for_thread.lock().unwrap();
                *state = false;
                drop(state);
                thread::sleep(Duration::from_millis(525));
                if let Some(window) = app_handle_for_thread.get_webview_window("voice") {
                    let _ = window.hide();
                }
                if let Some(hold_time) = hold_time_ms {
                    let _ = app_handle_for_thread.emit_to("voice", "hold-time", hold_time);
                }
            }
            last_control_state = control_pressed;
            thread::sleep(Duration::from_millis(15));
        }
    });

    app_handle.manage(listening_state);
    app_handle.manage(active_window);
}

#[tauri::command]
pub fn get_listening_state(app_handle: AppHandle) -> bool {
    use std::sync::{Arc, Mutex};
    let state: tauri::State<Arc<Mutex<bool>>> = app_handle.state();
    let listening = state.lock().unwrap();
    *listening
}
