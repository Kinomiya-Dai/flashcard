use dotenv::dotenv;
use std::env;
use serde::{Serialize, Deserialize};
use tauri::async_runtime::block_on;
use sqlx::{SqlitePool, Sqlite, Pool, query_as, FromRow, Error};


async fn sqlite_pool(db_url: &str) -> Result<Pool<Sqlite>, sqlx::Error> {
    let pool = SqlitePool::connect(db_url).await?;
    Ok(pool)
}


// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn insert_name(pool: tauri::State<'_, SqlitePool>) -> Result<Card, String> {
    log::error!("something bad happened!");
    insert_name_r(&pool).await.map_err(|e| e.to_string())
}


#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct Card {
    pub id: i64,
    pub name: String,
}

async fn insert_name_r(pool: &SqlitePool) -> Result<Card, sqlx::Error> {
    const NAME: &str = "aaa";
    let score = sqlx::query_as::<_, Card>(
        "INSERT INTO cards (name) VALUES ($1) RETURNING *"
    )
    .bind(NAME)
    .fetch_one(pool)
    .await?;
    Ok(score)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL not set");
    let pool = block_on(sqlite_pool(&database_url))?;
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![greet,insert_name])
        .manage(pool)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    Ok(())
}
