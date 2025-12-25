use serde::{Deserialize, Serialize};
use std::fs;
use tauri::{command, AppHandle, Manager};
use uuid::Uuid;

/// A single transcription history entry
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TranscriptionEntry {
    pub id: String,
    pub timestamp: i64,       // Unix timestamp in milliseconds
    pub duration_ms: u64,     // Recording duration in ms
    pub text: Option<String>, // Full text (if enabled in settings)
    pub word_count: u32,
    pub char_count: u32,
    pub shortcut_used: Option<String>,
    pub target_app: Option<String>,
}

/// Settings for history management
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct HistorySettings {
    pub enabled: bool,
    pub save_full_text: bool,
    pub retention_days: Option<u32>, // None means keep forever
}

impl Default for HistorySettings {
    fn default() -> Self {
        Self {
            enabled: true,
            save_full_text: true,
            retention_days: None,
        }
    }
}

/// Container for all history data
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TranscriptionHistory {
    pub entries: Vec<TranscriptionEntry>,
    pub settings: HistorySettings,
}

impl Default for TranscriptionHistory {
    fn default() -> Self {
        Self {
            entries: Vec::new(),
            settings: HistorySettings::default(),
        }
    }
}

fn get_history_path(app: &AppHandle) -> std::path::PathBuf {
    let local_data = app
        .path()
        .local_data_dir()
        .expect("Failed to get local data dir");
    local_data
        .join("vwisper")
        .join("transcription_history.json")
}

fn load_history_internal(app: &AppHandle) -> TranscriptionHistory {
    let path = get_history_path(app);
    if path.exists() {
        if let Ok(data) = fs::read_to_string(&path) {
            if let Ok(history) = serde_json::from_str::<TranscriptionHistory>(&data) {
                return history;
            }
        }
    }
    TranscriptionHistory::default()
}

fn save_history_internal(app: &AppHandle, history: &TranscriptionHistory) -> Result<(), String> {
    let path = get_history_path(app);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create dir: {}", e))?;
    }
    let data =
        serde_json::to_string_pretty(history).map_err(|e| format!("Failed to serialize: {}", e))?;
    fs::write(&path, data).map_err(|e| format!("Failed to write: {}", e))?;
    Ok(())
}

fn clean_old_entries(history: &mut TranscriptionHistory) {
    if let Some(retention_days) = history.settings.retention_days {
        let now = chrono::Utc::now().timestamp_millis();
        let retention_ms = (retention_days as i64) * 24 * 60 * 60 * 1000;
        let cutoff = now - retention_ms;
        history.entries.retain(|entry| entry.timestamp >= cutoff);
    }
}

#[command]
pub async fn load_history(app: AppHandle) -> Result<TranscriptionHistory, String> {
    let mut history = load_history_internal(&app);
    clean_old_entries(&mut history);
    // Save if we cleaned any entries
    let _ = save_history_internal(&app, &history);
    Ok(history)
}

#[command]
pub async fn get_history_settings(app: AppHandle) -> Result<HistorySettings, String> {
    let history = load_history_internal(&app);
    Ok(history.settings)
}

#[command]
pub async fn save_history_settings(
    app: AppHandle,
    settings: HistorySettings,
) -> Result<(), String> {
    let mut history = load_history_internal(&app);
    history.settings = settings;
    clean_old_entries(&mut history);
    save_history_internal(&app, &history)
}

#[command]
pub async fn save_history_entry(
    app: AppHandle,
    timestamp: i64,
    duration_ms: u64,
    text: String,
    word_count: u32,
    char_count: u32,
    shortcut_used: Option<String>,
    target_app: Option<String>,
) -> Result<(), String> {
    let mut history = load_history_internal(&app);

    // Only save if history is enabled
    if !history.settings.enabled {
        return Ok(());
    }

    let entry = TranscriptionEntry {
        id: Uuid::new_v4().to_string(),
        timestamp,
        duration_ms,
        text: if history.settings.save_full_text {
            Some(text)
        } else {
            None
        },
        word_count,
        char_count,
        shortcut_used,
        target_app,
    };

    history.entries.push(entry);
    clean_old_entries(&mut history);
    save_history_internal(&app, &history)
}

#[command]
pub async fn delete_history_entry(app: AppHandle, id: String) -> Result<(), String> {
    let mut history = load_history_internal(&app);
    history.entries.retain(|entry| entry.id != id);
    save_history_internal(&app, &history)
}

#[command]
pub async fn clear_history(app: AppHandle) -> Result<(), String> {
    let mut history = load_history_internal(&app);
    history.entries.clear();
    save_history_internal(&app, &history)
}

#[command]
pub async fn export_history(app: AppHandle, format: String) -> Result<String, String> {
    let history = load_history_internal(&app);

    match format.as_str() {
        "json" => serde_json::to_string_pretty(&history.entries)
            .map_err(|e| format!("Failed to export JSON: {}", e)),
        "csv" => {
            let mut csv = String::from(
                "id,timestamp,duration_ms,text,word_count,char_count,shortcut_used,target_app\n",
            );
            for entry in &history.entries {
                let text = entry.text.as_deref().unwrap_or("").replace('"', "\"\"");
                let shortcut = entry.shortcut_used.as_deref().unwrap_or("");
                let target = entry.target_app.as_deref().unwrap_or("");
                csv.push_str(&format!(
                    "{},{},{},\"{}\",{},{},\"{}\",\"{}\"\n",
                    entry.id,
                    entry.timestamp,
                    entry.duration_ms,
                    text,
                    entry.word_count,
                    entry.char_count,
                    shortcut,
                    target
                ));
            }
            Ok(csv)
        }
        _ => Err(format!("Unsupported export format: {}", format)),
    }
}
