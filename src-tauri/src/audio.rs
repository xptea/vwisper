use rodio::{Decoder, OutputStream, Sink};
use std::io::BufReader;
use std::fs::File;
use std::path::PathBuf;
use std::thread;

pub fn play_start_sound() {
    thread::spawn(|| {
        if let Err(e) = play_sound("sounds/start.wav") {
            eprintln!("Failed to play start sound: {}", e);
        }
    });
}

pub fn play_end_sound() {
    thread::spawn(|| {
        if let Err(e) = play_sound("sounds/ending.wav") {
            eprintln!("Failed to play end sound: {}", e);
        }
    });
}

fn play_sound(filename: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let mut sound_path = std::env::current_exe()?;
    sound_path.pop(); 

    let dev_path = sound_path.join("../../../src-tauri/src").join(filename);
    let prod_path = sound_path.join(filename);
    
    let final_path = if dev_path.exists() {
        dev_path
    } else if prod_path.exists() {
        prod_path
    } else {
        PathBuf::from("src-tauri/src").join(filename)
    };

    let (_stream, stream_handle) = OutputStream::try_default()?;
    let sink = Sink::try_new(&stream_handle)?;
    
    let file = File::open(&final_path)?;
    let source = Decoder::new(BufReader::new(file))?;
    
    sink.append(source);
    sink.sleep_until_end();
    
    Ok(())
}

#[tauri::command]
pub async fn play_start_sound_command() -> Result<(), String> {
    play_start_sound();
    Ok(())
}

#[tauri::command]  
pub async fn play_end_sound_command() -> Result<(), String> {
    play_end_sound();
    Ok(())
}