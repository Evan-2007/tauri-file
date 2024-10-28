use std::collections::HashMap;
use std::string::String;
use std::sync::{Arc, Mutex};
use std::thread::spawn;
use uuid::Uuid;
use std::io::{Read, Write};

#[derive(Clone, serde::Serialize)]
struct DownloadStatus {
    id: String,
    url: String,
    path: String,
    status: String,
    is_downloaded: bool,
}

struct DownloadState(Arc<Mutex<HashMap<String, DownloadStatus>>>);

#[tauri::command]
fn check_download(id: &str, state: tauri::State<DownloadState>) -> Option<bool> {
    println!("Checking download status for ID: {}", id);
    let state = state.0.lock().unwrap();
    state.get(id).map(|status| status.is_downloaded)
}

#[tauri::command]
fn get_all_downloads(state: tauri::State<DownloadState>) -> Vec<DownloadStatus> {
    let state = state.0.lock().unwrap();
    state.values().cloned().collect()
}

#[tauri::command]
fn download_file(url: &str, path: &str, state: tauri::State<DownloadState>) -> String {  
    println!("Starting download from: {}", url);
    let url = url.to_owned();
    let path = path.to_owned();
    let state = state.0.clone();
    let id: String = Uuid::new_v4().to_string();
    let id_clone = id.clone();
   
    // Initialize download status
    {
        let mut state = state.lock().unwrap();
        state.insert(id.clone(), DownloadStatus {
            id: id.clone(),
            url: url.clone(),
            path: path.clone(),
            status: format!("0MB/0MB"),
            is_downloaded: false,
        });
    }
    spawn(move || {
        let client = reqwest::blocking::Client::new();
        match client.get(&url).send() {
            Ok(mut response) => {
                let total_size = response.content_length().unwrap_or(0);
                match std::fs::File::create(&path) {
                    Ok(mut file) => {
                        let mut buffer = [0u8; 8192];
                        let mut downloaded = 0u64;

                        loop {
                            let bytes_read = match response.read(&mut buffer) {
                                Ok(0) => break, // EOF reached
                                Ok(n) => n,
                                Err(e) => {
                                    println!("Error reading response: {}", e);
                                    break;
                                }
                            };

                            if let Err(e) = file.write_all(&buffer[..bytes_read]) {
                                println!("Error writing to file: {}", e);
                                break;
                            }

                            downloaded += bytes_read as u64;

                            // Update status
                            let mut state = state.lock().unwrap();
                            if let Some(status) = state.get_mut(&id_clone) {
                                let total_mb = total_size as f64 / (1024.0 * 1024.0);
                                let downloaded_mb = downloaded as f64 / (1024.0 * 1024.0);
                                status.status = format!("{:.2}MB/{:.2}MB", downloaded_mb, total_mb);
                            }
                        }

                        // After download completes
                        let mut state = state.lock().unwrap();
                        if let Some(status) = state.get_mut(&id_clone) {
                            status.is_downloaded = true;
                        }

                        println!("Downloaded file from {} to {}", url, path);
                    },
                    Err(e) => println!("Error creating file: {}", e),
                }
            },
            Err(e) => println!("Error downloading file: {}", e),
        }
    });
    id
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            check_download,
            download_file,
            get_all_downloads,
        ])
        .manage(DownloadState(Arc::new(Mutex::new(HashMap::new()))))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}