use crate::audio;
#[cfg(not(target_os = "macos"))]
use device_query::{DeviceQuery, DeviceState, Keycode};
use std::thread;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};

#[cfg(target_os = "macos")]
use core_foundation::runloop::{kCFRunLoopCommonModes, CFRunLoop};
#[cfg(target_os = "macos")]
use core_graphics::event::{
    CGEventFlags, CGEventTap, CGEventTapLocation, CGEventTapOptions, CGEventTapPlacement,
    CGEventType, EventField, KeyCode,
};
#[cfg(target_os = "macos")]
use std::os::raw::c_int;
#[cfg(target_os = "macos")]
use std::sync::atomic::{AtomicBool, Ordering};

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HWND;
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{GetForegroundWindow, SetForegroundWindow};

use crate::TypingState;

#[cfg(target_os = "macos")]
static FN_PRESSED_EVENT_TAP: AtomicBool = AtomicBool::new(false);
#[cfg(target_os = "macos")]
static FN_PRESSED_HID: AtomicBool = AtomicBool::new(false);

#[cfg(target_os = "macos")]
extern "C" {
    fn vwisper_start_fn_key_monitor() -> c_int;
}

#[cfg(target_os = "macos")]
#[no_mangle]
pub extern "C" fn vwisper_fn_key_update(is_down: c_int) {
    FN_PRESSED_HID.store(is_down != 0, Ordering::SeqCst);
}

#[cfg(target_os = "macos")]
fn start_fn_key_listener() {
    start_fn_key_event_tap_listener();
    start_fn_key_hid_listener();
}

#[cfg(target_os = "macos")]
fn start_fn_key_event_tap_listener() {
    thread::spawn(move || {
        let tap = CGEventTap::new(
            CGEventTapLocation::HID,
            CGEventTapPlacement::HeadInsertEventTap,
            CGEventTapOptions::ListenOnly,
            vec![
                CGEventType::FlagsChanged,
                CGEventType::KeyDown,
                CGEventType::KeyUp,
            ],
            move |_proxy, event_type, event| {
                let keycode = event.get_integer_value_field(EventField::KEYBOARD_EVENT_KEYCODE);
                let is_fn_key = keycode as u16 == KeyCode::FUNCTION;

                if matches!(event_type, CGEventType::FlagsChanged)
                    && (is_fn_key
                        || event
                            .get_flags()
                            .contains(CGEventFlags::CGEventFlagSecondaryFn))
                {
                    let is_down = event
                        .get_flags()
                        .contains(CGEventFlags::CGEventFlagSecondaryFn);
                    FN_PRESSED_EVENT_TAP.store(is_down, Ordering::SeqCst);
                } else if is_fn_key {
                    let is_down = matches!(event_type, CGEventType::KeyDown);
                    FN_PRESSED_EVENT_TAP.store(is_down, Ordering::SeqCst);
                }
                None
            },
        );

        match tap {
            Ok(tap) => {
                let current = CFRunLoop::get_current();
                if let Ok(run_loop_source) = tap.mach_port.create_runloop_source(0) {
                    unsafe {
                        current.add_source(&run_loop_source, kCFRunLoopCommonModes);
                    }
                    tap.enable();
                    CFRunLoop::run_current();
                } else {
                    eprintln!("Failed to create macOS run loop source for key tap");
                }
            }
            Err(_) => {
                eprintln!("Failed to create macOS key event tap. Input Monitoring permission may be required.");
            }
        }
    });
}

#[cfg(target_os = "macos")]
fn start_fn_key_hid_listener() {
    thread::spawn(|| unsafe {
        const HID_MANAGER_CREATE_FAILED: c_int = -1;
        let result = vwisper_start_fn_key_monitor();
        if result != 0 {
            if result == HID_MANAGER_CREATE_FAILED {
                eprintln!("Failed to create macOS Fn key HID manager.");
            } else {
                eprintln!(
                    "Failed to start macOS Fn key HID monitor (IOReturn=0x{:08x}). Input Monitoring permission may be required.",
                    result as u32
                );
            }
        }
    });
}

#[cfg(target_os = "macos")]
fn is_fn_pressed() -> bool {
    FN_PRESSED_EVENT_TAP.load(Ordering::SeqCst) || FN_PRESSED_HID.load(Ordering::SeqCst)
}

pub fn start_global_key_monitor(app_handle: AppHandle) {
    use std::sync::{Arc, Mutex};
    let listening_state = Arc::new(Mutex::new(false));
    let active_window = Arc::new(Mutex::new(None::<isize>));
    let app_handle_for_thread = app_handle.clone();
    let listening_state_for_thread = listening_state.clone();
    #[cfg(target_os = "windows")]
    let active_window_for_thread = active_window.clone();
    #[cfg(target_os = "macos")]
    start_fn_key_listener();
    thread::spawn(move || {
        #[cfg(not(target_os = "macos"))]
        let device_state = DeviceState::new();
        let mut last_control_state = false;
        let mut last_action_time = Instant::now();
        #[cfg(target_os = "windows")]
        let mut active_window_handle: Option<HWND> = None;
        let mut hold_start_time: Option<Instant> = None;

        loop {
            #[cfg(not(target_os = "macos"))]
            let keys = device_state.get_keys();
            let is_typing = if let Some(state) = app_handle_for_thread.try_state::<TypingState>() {
                *state.0.lock().unwrap()
            } else {
                false
            };
            #[cfg(target_os = "macos")]
            let control_pressed = is_fn_pressed() || is_typing;
            #[cfg(not(target_os = "macos"))]
            let control_pressed = keys.contains(&Keycode::RControl) || is_typing;
            let now = Instant::now();

            if control_pressed
                && !last_control_state
                && now.duration_since(last_action_time) > Duration::from_millis(25)
            {
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

            if !control_pressed
                && last_control_state
                && now.duration_since(last_action_time) > Duration::from_millis(25)
            {
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
