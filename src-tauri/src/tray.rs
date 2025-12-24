use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Manager, Runtime,
};

pub fn setup_system_tray<R: Runtime>(
    app: &mut tauri::App<R>,
) -> Result<(), Box<dyn std::error::Error>> {
    let open_home = MenuItemBuilder::with_id("open_home", "Open Home").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = MenuBuilder::new(app).items(&[&open_home, &quit]).build()?;

    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .icon(app.default_window_icon().unwrap().clone())
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "open_home" => {
                if let Some(window) = app.get_webview_window("home") {
                    let _ = window.show();
                    let _ = window.set_focus();
                } else {
                    let _home_window = tauri::webview::WebviewWindowBuilder::new(
                        app,
                        "home",
                        tauri::WebviewUrl::App("".into()),
                    )
                    .title("Home")
                    .inner_size(1600.0, 800.0)
                    .decorations(false)
                    .build();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}
