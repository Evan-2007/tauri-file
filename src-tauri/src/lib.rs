use std::sync::{Arc, Mutex};
use std::{fmt::format, os::windows::thread};
use std::thread::spawn;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}


#[derive(Clone, serde::Serialize)]
struct DownloadStatus {
    is_downloaded: bool,
}

struct DownloadState(Arc<Mutex<DownloadStatus>>);


#[tauri::command]
fn check_download(path: &str, state: tauri::State<DownloadState>) -> bool {
    print!("Checking download status");
    let state = state.0.clone();
    let state = state.lock().unwrap();
    state.is_downloaded
}   

#[tauri::command]
fn download_file(url: &str, path: &str, state: tauri::State<DownloadState>) {   
    println!("I was invoked from JS!");
    let url = url.to_owned();
    let path = path.to_owned();
    let state = state.0.clone();

    {
        let mut state = state.lock().unwrap();
        state.is_downloaded = false;
    }

    spawn(move || {
        let client = reqwest::blocking::Client::new();
        let response = client.get(&url).send().unwrap();
        let mut file = std::fs::File::create(&path).unwrap();
        std::io::copy(&mut response.bytes().unwrap().as_ref(), &mut file).unwrap();
        println!("Downloaded file from {} to {}", url, path);
            
            {
                let mut state = state.lock().unwrap();
                state.is_downloaded = true;
            }
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {


    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            check_download,
            download_file,
            greet  // Include this if you want to keep the greet function
        ])
        .manage(DownloadState(Arc::new(Mutex::new(DownloadStatus {
            is_downloaded: false,
        }))))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

