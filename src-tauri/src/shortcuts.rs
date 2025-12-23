use crate::stt;
use std::collections::HashMap;
use std::fs;
use tauri::{command, AppHandle, Manager};

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct Shortcuts {
    pub shortcuts: HashMap<String, ShortcutData>,
}

#[derive(serde::Deserialize)]
struct OldShortcuts {
    shortcuts: HashMap<String, String>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct ShortcutData {
    pub original: String,
    pub text: String,
}

impl Default for Shortcuts {
    fn default() -> Self {
        Self {
            shortcuts: HashMap::new(),
        }
    }
}

fn normalize(s: &str) -> String {
    s.chars()
        .filter(|c| c.is_alphanumeric() || c.is_whitespace())
        .collect::<String>()
        .to_lowercase()
        .trim()
        .to_string()
}

fn get_shortcuts_path(app: &AppHandle) -> std::path::PathBuf {
    let local_data = app
        .path()
        .local_data_dir()
        .expect("Failed to get local data dir");
    local_data.join("vwisper").join("shortcuts.json")
}

#[command]
pub async fn load_shortcuts(app: AppHandle) -> Result<Shortcuts, String> {
    let path = get_shortcuts_path(&app);
    if path.exists() {
        let data =
            fs::read_to_string(&path).map_err(|e| format!("Failed to read shortcuts: {}", e))?;
        match serde_json::from_str::<Shortcuts>(&data) {
            Ok(shortcuts) => Ok(shortcuts),
            Err(_) => match serde_json::from_str::<OldShortcuts>(&data) {
                Ok(old) => {
                    let mut new_shortcuts = HashMap::new();
                    for (phrase, text) in old.shortcuts {
                        let normalized = normalize(&phrase);
                        new_shortcuts.insert(
                            normalized,
                            ShortcutData {
                                original: phrase,
                                text,
                            },
                        );
                    }
                    let shortcuts = Shortcuts {
                        shortcuts: new_shortcuts,
                    };
                    if let Err(e) = save_shortcuts(app, shortcuts.clone()).await {
                        eprintln!("Failed to save migrated shortcuts: {}", e);
                    }
                    Ok(shortcuts)
                }
                Err(e) => Err(format!("Failed to parse shortcuts: {}", e)),
            },
        }
    } else {
        Ok(Shortcuts::default())
    }
}

#[command]
pub async fn save_shortcuts(app: AppHandle, shortcuts: Shortcuts) -> Result<(), String> {
    let path = get_shortcuts_path(&app);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create dir: {}", e))?;
    }
    let data = serde_json::to_string_pretty(&shortcuts)
        .map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(&path, data).map_err(|e| format!("Failed to write: {}", e))?;
    Ok(())
}

#[command]
pub async fn add_shortcut(app: AppHandle, phrase: String, text: String) -> Result<(), String> {
    let mut shortcuts = load_shortcuts(app.clone()).await?;
    let normalized = normalize(&phrase);
    shortcuts.shortcuts.insert(
        normalized,
        ShortcutData {
            original: phrase,
            text,
        },
    );
    save_shortcuts(app, shortcuts).await
}

#[command]
pub async fn remove_shortcut(app: AppHandle, phrase: String) -> Result<(), String> {
    let mut shortcuts = load_shortcuts(app.clone()).await?;
    shortcuts.shortcuts.remove(&phrase);
    save_shortcuts(app, shortcuts).await
}

#[command]
pub async fn process_text(app: AppHandle, text: String) -> Result<(), String> {
    println!("[shortcuts] process_text received: {}", text);
    let shortcuts = load_shortcuts(app.clone()).await?;
    let normalized = normalize(&text);
    if normalized.is_empty() {
        println!("[shortcuts] normalized text is empty, skipping");
        return Ok(());
    }
    if let Some(data) = shortcuts.shortcuts.get(&normalized) {
        println!(
            "[shortcuts] shortcut match: \"{}\" -> \"{}\"",
            data.original, data.text
        );
        stt::type_text_internal(app, data.text.clone()).await
    } else {
        println!("[shortcuts] no shortcut match, typing raw text");
        stt::type_text_internal(app, text).await
    }
}
