use tauri::webview::WebviewWindowBuilder;
use tauri::WebviewUrl;

pub fn setup_windows(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let _home_window = WebviewWindowBuilder::new(app, "home", WebviewUrl::App("".into()))
        .title("Home")
        .visible(false) // Start hidden
        .build()?;

    let monitors = app.available_monitors()?;
    // println!("Available monitors: {:?}", monitors.len());

    let primary_monitor = monitors.iter().max_by_key(|monitor| {
        let size = monitor.size();
        size.width * size.height
    });

    if let Some(monitor) = primary_monitor {
        let screen_size = monitor.size();
        // let scale_factor = monitor.scale_factor();

        // println!("Monitor: {:?}", monitor.name());
        // println!(
        //     "Physical screen size: {}x{}",
        //     screen_size.width, screen_size.height
        // );
        // println!("Scale factor: {}", scale_factor);

        let actual_width = screen_size.width as f64;
        let actual_height = screen_size.height as f64;

        // println!(
        //     "Using physical screen size: {}x{}",
        //     actual_width, actual_height
        // );

        let window_width = 150.0;
        let window_height = 43.0;
        let padding = 150.0;

        let x = (actual_width - window_width) / 2.0;
        let y = actual_height - window_height - padding;

        // println!("Window position: x={}, y={}", x, y);

        let voice_window = WebviewWindowBuilder::new(app, "voice", tauri::WebviewUrl::External("http://localhost:1420/voice".parse().unwrap()))
            .title("Voice")
            .decorations(false)
            .shadow(false)
            .transparent(true)
            .inner_size(window_width, window_height)
            .always_on_top(true)
            .skip_taskbar(true)
            .build()?;

        let _ = voice_window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
            x: x as i32,
            y: y as i32,
        }));

        let _ = voice_window.hide();
    }
    Ok(())
}
