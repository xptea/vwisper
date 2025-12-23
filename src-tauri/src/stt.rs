use crate::TypingState;
#[cfg(target_os = "macos")]
use core_graphics::event::{CGEvent, CGEventTapLocation};
#[cfg(target_os = "macos")]
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};
#[cfg(target_os = "windows")]
use std::mem;
use std::sync::mpsc::{channel, Sender};
#[cfg(target_os = "windows")]
use std::sync::Arc;
use std::sync::Mutex;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};
#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HWND;
#[cfg(target_os = "windows")]
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, KEYEVENTF_UNICODE, VIRTUAL_KEY,
};
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::SetForegroundWindow;

lazy_static::lazy_static! {
    static ref TEXT_SENDER: Mutex<Option<Sender<(String, Option<isize>)>>> = Mutex::new(None);
}

pub fn init_stt_thread() {
    let (tx, rx) = channel::<(String, Option<isize>)>();
    *TEXT_SENDER.lock().unwrap() = Some(tx);

    thread::spawn(move || {
        println!("[stt] text dispatch thread started");
        #[cfg(target_os = "windows")]
        {
            for (text, hwnd) in rx {
                println!("[stt] dispatching text to Windows: {}", text);
                if let Some(h) = hwnd {
                    unsafe {
                        let hwnd = HWND(h as *mut std::ffi::c_void);
                        let _ = SetForegroundWindow(hwnd);
                    }
                    thread::sleep(Duration::from_millis(20));
                }

                if let Err(error) = send_text_windows(&text) {
                    eprintln!("Failed to type text on Windows: {}", error);
                }
                thread::sleep(Duration::from_millis(100));
            }
        }

        #[cfg(target_os = "macos")]
        {
            let event_source = CGEventSource::new(CGEventSourceStateID::HIDSystemState).ok();

            for (text, _hwnd) in rx {
                println!("[stt] dispatching text to macOS: {}", text);
                if let Some(ref source) = event_source {
                    if let Err(error) = post_text_macos(source, &text) {
                        eprintln!("Failed to type text on macOS: {}", error);
                    }
                    thread::sleep(Duration::from_millis(100));
                } else {
                    eprintln!("Failed to create macOS event source for text input");
                }
            }
        }

        #[cfg(not(any(target_os = "windows", target_os = "macos")))]
        {
            for (text, _hwnd) in rx {
                eprintln!("Text typing is not supported on this platform: {}", text);
            }
        }
    });
}

#[cfg(target_os = "macos")]
fn post_text_macos(source: &CGEventSource, text: &str) -> Result<(), String> {
    const MACOS_TEXT_CHUNK_SIZE: usize = 20;
    let mut chunk = String::new();
    let mut chunk_len = 0;

    for ch in text.chars() {
        chunk.push(ch);
        chunk_len += 1;
        if chunk_len >= MACOS_TEXT_CHUNK_SIZE {
            post_text_chunk_macos(source, &chunk)?;
            chunk.clear();
            chunk_len = 0;
        }
    }

    if !chunk.is_empty() {
        post_text_chunk_macos(source, &chunk)?;
    }
    Ok(())
}

#[cfg(target_os = "macos")]
fn post_text_chunk_macos(source: &CGEventSource, text: &str) -> Result<(), String> {
    let key_down = CGEvent::new_keyboard_event(source.clone(), 0, true)
        .map_err(|_| "Failed to create key down event".to_string())?;
    key_down.set_string(text);
    key_down.post(CGEventTapLocation::HID);

    let key_up = CGEvent::new_keyboard_event(source.clone(), 0, false)
        .map_err(|_| "Failed to create key up event".to_string())?;
    key_up.set_string("");
    key_up.post(CGEventTapLocation::HID);
    Ok(())
}

#[tauri::command]
pub async fn type_text(app_handle: AppHandle, text: String) -> Result<(), String> {
    type_text_internal(app_handle, text).await
}

pub async fn type_text_internal(app_handle: AppHandle, text: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        if let Some(state) = app_handle.try_state::<TypingState>() {
            *state.0.lock().unwrap() = true;
        }

        let window_state: tauri::State<Arc<Mutex<Option<isize>>>> = app_handle.state();
        let active_window = *window_state.lock().unwrap();

        println!("[stt] queueing text for Windows: {}", text);
        if let Some(sender) = TEXT_SENDER.lock().unwrap().as_ref() {
            let _ = sender.send((text, active_window));
        }

        if let Some(state) = app_handle.try_state::<TypingState>() {
            *state.0.lock().unwrap() = false;
        }

        Ok(())
    }
    #[cfg(target_os = "macos")]
    {
        if let Some(state) = app_handle.try_state::<TypingState>() {
            *state.0.lock().unwrap() = true;
        }

        println!("[stt] queueing text for macOS: {}", text);
        if let Some(sender) = TEXT_SENDER.lock().unwrap().as_ref() {
            let _ = sender.send((text, None));
        }

        if let Some(state) = app_handle.try_state::<TypingState>() {
            *state.0.lock().unwrap() = false;
        }

        Ok(())
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        Err("Text typing is only supported on Windows and macOS".to_string())
    }
}

#[cfg(target_os = "windows")]
fn send_text_windows(text: &str) -> Result<(), String> {
    const WINDOWS_TEXT_CHUNK_SIZE: usize = 64;
    let mut chunk = Vec::with_capacity(WINDOWS_TEXT_CHUNK_SIZE);

    for unit in text.encode_utf16() {
        chunk.push(unit);
        if chunk.len() >= WINDOWS_TEXT_CHUNK_SIZE {
            send_unicode_chunk(&chunk)?;
            chunk.clear();
        }
    }

    if !chunk.is_empty() {
        send_unicode_chunk(&chunk)?;
    }

    Ok(())
}

#[cfg(target_os = "windows")]
fn send_unicode_chunk(units: &[u16]) -> Result<(), String> {
    let mut inputs = Vec::with_capacity(units.len() * 2);

    for &unit in units {
        inputs.push(INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VIRTUAL_KEY(0),
                    wScan: unit,
                    dwFlags: KEYEVENTF_UNICODE,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        });

        inputs.push(INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: VIRTUAL_KEY(0),
                    wScan: unit,
                    dwFlags: KEYEVENTF_UNICODE | KEYEVENTF_KEYUP,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        });
    }

    let sent = unsafe { SendInput(&inputs, mem::size_of::<INPUT>() as i32) };
    if sent as usize != inputs.len() {
        return Err(format!(
            "SendInput sent {} of {} events",
            sent,
            inputs.len()
        ));
    }

    Ok(())
}

#[tauri::command]
pub async fn restore_window_focus(hwnd: isize) -> Result<(), String> {
    let _ = hwnd;
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
