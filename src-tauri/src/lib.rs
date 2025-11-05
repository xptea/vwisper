mod window_setup;
mod key_monitor;
mod stt;
mod window_state;
mod audio;
mod tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            window_setup::setup_windows(app)?;
            tray::setup_system_tray(app)?;
            key_monitor::start_global_key_monitor(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![ key_monitor::get_listening_state, stt::type_text, stt::restore_window_focus, window_state::get_active_window, audio::play_start_sound_command, audio::play_end_sound_command])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
