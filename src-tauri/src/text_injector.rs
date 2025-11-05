use std::env;
use clipboard::{ClipboardContext, ClipboardProvider};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    SendInput, INPUT, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, VIRTUAL_KEY,
};
use std::mem;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("No text provided");
        return;
    }
    let text = &args[1];

    // Set clipboard
    let mut ctx: ClipboardContext = ClipboardProvider::new().unwrap();
    ctx.set_contents(text.to_string()).unwrap();

    // Simulate Ctrl+V
    send_key(VIRTUAL_KEY(0x11), false); // VK_CONTROL
    send_key(VIRTUAL_KEY(0x56), false); // VK_V
    send_key(VIRTUAL_KEY(0x56), true);  // VK_V up
    send_key(VIRTUAL_KEY(0x11), true);  // VK_CONTROL up
}

fn send_key(vk: VIRTUAL_KEY, up: bool) {
    let mut input = INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: unsafe { mem::zeroed() },
    };
    unsafe {
        input.Anonymous.ki = KEYBDINPUT {
            wVk: vk,
            wScan: 0,
            dwFlags: if up { KEYEVENTF_KEYUP } else { Default::default() },
            time: 0,
            dwExtraInfo: 0,
        };
        SendInput(&[input], mem::size_of::<INPUT>() as i32);
    }
}