use crate::TypingState;
use arboard::Clipboard;
#[cfg(target_os = "windows")]
use std::mem;
use std::sync::mpsc::{channel, Sender};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Manager};
#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HWND;
#[cfg(target_os = "windows")]
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, VK_CONTROL, VK_V,
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
        let mut clipboard = Clipboard::new().ok();

        for (text, hwnd) in rx {
            #[cfg(target_os = "windows")]
            if let Some(h) = hwnd {
                unsafe {
                    let hwnd = HWND(h as *mut std::ffi::c_void);
                    let _ = SetForegroundWindow(hwnd);
                }
                thread::sleep(Duration::from_millis(20));
            }

            let mut success = false;
            for _ in 0..3 {
                if let Some(ref mut cb) = clipboard {
                    if cb.set_text(text.clone()).is_ok() {
                        if let Ok(content) = cb.get_text() {
                            if content == text {
                                success = true;
                                break;
                            }
                        }
                    }
                } else {
                    clipboard = Clipboard::new().ok();
                }
                thread::sleep(Duration::from_millis(10));
            }

            if success {
                #[cfg(target_os = "windows")]
                unsafe {
                    send_paste_combo();
                }
                thread::sleep(Duration::from_millis(100));
            } else {
                eprintln!("Failed to set clipboard for text: {}", text);
            }
        }
    });
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

        if let Some(sender) = TEXT_SENDER.lock().unwrap().as_ref() {
            let _ = sender.send((text, active_window));
        }

        if let Some(state) = app_handle.try_state::<TypingState>() {
            *state.0.lock().unwrap() = false;
        }

        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Text typing is only supported on Windows".to_string())
    }
}

#[cfg(target_os = "windows")]
unsafe fn send_paste_combo() {
    let mut inputs = Vec::new();

    inputs.push(INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
            ki: KEYBDINPUT {
                wVk: VK_CONTROL,
                wScan: 0,
                dwFlags: Default::default(),
                time: 0,
                dwExtraInfo: 0,
            },
        },
    });

    inputs.push(INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
            ki: KEYBDINPUT {
                wVk: VK_V,
                wScan: 0,
                dwFlags: Default::default(),
                time: 0,
                dwExtraInfo: 0,
            },
        },
    });

    inputs.push(INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
            ki: KEYBDINPUT {
                wVk: VK_V,
                wScan: 0,
                dwFlags: KEYEVENTF_KEYUP,
                time: 0,
                dwExtraInfo: 0,
            },
        },
    });

    inputs.push(INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: windows::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
            ki: KEYBDINPUT {
                wVk: VK_CONTROL,
                wScan: 0,
                dwFlags: KEYEVENTF_KEYUP,
                time: 0,
                dwExtraInfo: 0,
            },
        },
    });

    SendInput(&inputs, mem::size_of::<INPUT>() as i32);
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
