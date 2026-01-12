use dotenv::dotenv;
use std::env;
use serde::{Serialize, Deserialize};
use tauri::{State, async_runtime::block_on};
use sqlx::{SqlitePool, Sqlite, Pool, query_as, FromRow, Error};


async fn sqlite_pool(db_url: &str) -> Result<Pool<Sqlite>, sqlx::Error> {
    let pool = SqlitePool::connect(db_url).await?;
    Ok(pool)
}

#[derive(Debug, Deserialize)]
struct Card {
    id: String,
    front: String,
    back: String,
}

#[derive(Debug, Deserialize)]
struct SaveDeckPayload {
    title: String,
    category: String,
    cards: Vec<Card>,
    card_count: i64,
}

#[derive(Debug, Deserialize)]
struct UpdateDeckPayload {
    deck_id: i64,
    title: String,
    category: String,
    cards: Vec<Card>,
    card_count: i64,
}

#[derive(Serialize)]
pub struct DeckWithProgress {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub category_name: Option<String>,
    pub progress: i64, // デッキの進捗（カード何枚目まで学習済みか）
    pub card_count: i64, // デッキのカード枚数
}

#[derive(Serialize)]
struct CardDto {
    id: i64,
    front: String,
    back: String,
}
#[derive(Serialize)]
struct DeckDetail {
    title: String,
    category_name: Option<String>,
    cards: Vec<CardDto>,
}


#[tauri::command]
async fn save_deck(payload: SaveDeckPayload,
    pool: State<'_, Pool<Sqlite>>,) -> Result<(), String> {
    log::debug!("デッキをDB保存します。");
    save_to_db_deck(payload, &pool)
        .await
        .map_err(|e| e.to_string())?;
    // ここでDB保存
    Ok(())
}

#[tauri::command]
async fn update_deck(payload: UpdateDeckPayload,
    pool: State<'_, Pool<Sqlite>>,) -> Result<(), String> {
    log::debug!("update_deck start: deck_id={}", payload.deck_id);
    update_to_db_card(payload, &pool)
        .await
        .map_err(|e| e.to_string())?;
    // ここでDB保存
    Ok(())
}

#[tauri::command]
async fn fetch_decks(pool: State<'_, SqlitePool>) -> Result<Vec<DeckWithProgress>, String> {
    let pool = pool.inner();
    let rows = sqlx::query!(
        r#"
        SELECT
            d.id,
            d.title,
            d.description,
            c.name as category_name,
            IFNULL(p.progress, 0) as progress,
            d.card_count
        FROM t101_decks d
        LEFT JOIN t104_categories c ON d.category_id = c.id
        LEFT JOIN t103_deck_progress p ON p.deck_id = d.id
        ORDER BY d.created_at DESC
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let decks = rows.into_iter().map(|r| DeckWithProgress {
        id: r.id,
        title: r.title,
        description: r.description,
        category_name: r.category_name,
        progress: r.progress,
        card_count: r.card_count,
    }).collect();

    Ok(decks)
}

#[tauri::command]
async fn get_deck_cards(
    deck_id: i64,
    pool: State<'_, Pool<Sqlite>>,
) -> Result<DeckDetail, String> {
    // デッキ + カテゴリ
    let deck = sqlx::query!(
        r#"
        SELECT
            d.title as title,
            c.name as category_name
        FROM t101_decks d
        LEFT JOIN t104_categories c
          ON d.category_id = c.id
        WHERE d.id = ?
        "#,
        deck_id
    )
    .fetch_one(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    // カード一覧
    let cards = sqlx::query!(
        r#"
        SELECT
            id,
            front,
            back
        FROM t102_cards
        WHERE deck_id = ?
        ORDER BY id ASC
        "#,
        deck_id
    )
    .fetch_all(&*pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(DeckDetail {
        title: deck.title,
        category_name: deck.category_name,
        cards: cards
            .into_iter()
            .map(|c| CardDto {
                id: c.id,
                front: c.front,
                back: c.back,
            })
            .collect(),
    })
}

async fn save_to_db_deck(payload: SaveDeckPayload, pool: &Pool<Sqlite>,) -> Result<(), sqlx::Error> {

    let mut tx = pool.begin().await?;

    // カテゴリIDを取得
    let category_id: i64 = get_or_create_category_id(&payload.category, &mut tx).await?;

    let result = sqlx::query("INSERT INTO t101_decks (title, card_count,category_id) VALUES (?1, ?2,?3)").bind(&payload.title).bind(&payload.card_count).bind(category_id).execute(&mut *tx).await?;

    let deck_id = result.last_insert_rowid();

    for card in payload.cards {
        let result = sqlx::query("INSERT INTO t102_cards (deck_id, front, back) VALUES (?1, ?2, ?3)").bind(&deck_id).bind(&card.front).bind(&card.back).execute(&mut *tx).await?;
    }

    tx.commit().await?;

    Ok(())
}


async fn update_to_db_card(payload: UpdateDeckPayload, pool: &Pool<Sqlite>,) -> Result<(), sqlx::Error> {

    println!("START update_to_db_deck");

    let mut tx = pool.begin().await?;
    println!("TX started");

    let category_id = get_or_create_category_id(&payload.category, &mut tx).await?;
    println!("category_id = {}", category_id);

    let result = sqlx::query(
        "UPDATE t101_decks
         SET title = ?1,
             card_count = ?2,
             category_id = ?3
         WHERE id = ?4"
    )
    .bind(&payload.title)
    .bind(&payload.card_count)
    .bind(category_id)
    .bind(payload.deck_id)
    .execute(&mut *tx)
    .await?;
    println!("deck updated rows={}", result.rows_affected());

    sqlx::query("DELETE FROM t102_cards WHERE deck_id = ?1")
        .bind(payload.deck_id)
        .execute(&mut *tx)
        .await?;
    println!("cards deleted");

    for card in payload.cards {
        sqlx::query(
            "INSERT INTO t102_cards (deck_id, front, back)
             VALUES (?1, ?2, ?3)"
        )
        .bind(payload.deck_id)
        .bind(&card.front)
        .bind(&card.back)
        .execute(&mut *tx)
        .await?;
    }
    println!("cards inserted");

    tx.commit().await?;
    println!("TX committed");

    Ok(())
}

async fn get_or_create_category_id(
    category_name: &str,
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
) -> Result<i64, sqlx::Error> {
    // 1. まず存在チェック
    let existing_id: Option<i64> = sqlx::query_scalar(
        "SELECT id FROM t104_categories WHERE name = ?1"
    )
    .bind(category_name)
    .fetch_optional(&mut **tx)
    .await?;

    if let Some(id) = existing_id {
        // 既に存在する場合はそのIDを返す
        return Ok(id);
    }

    // 2. 存在しなければ新規作成
    sqlx::query(
        "INSERT INTO t104_categories (name, created_at, updated_at)
         VALUES (?1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
    )
    .bind(category_name)
    .execute(&mut **tx)
    .await?;

    // 3. 新規作成したIDを取得
    let new_id: i64 = sqlx::query_scalar(
        "SELECT id FROM t104_categories WHERE name = ?1 ORDER BY id DESC LIMIT 1"
    )
    .bind(category_name)
    .fetch_one(&mut **tx)
    .await?;

    Ok(new_id)
}

pub async fn init_db(pool: &SqlitePool) -> Result<(), sqlx::Error> {
    // 初期化フラグを確認
    let initialized: Option<bool> = sqlx::query_scalar!(
        "SELECT value FROM t100_meta WHERE key = 'db-init'"
    )
    .fetch_optional(pool)
    .await?;

    if initialized.unwrap_or(false) {
        // すでに初期化済み → スキップ
        return Ok(());
    }

    // --- 初期データ挿入処理 ---
    // --- 以下、初期データ挿入処理 ---
    let categories = vec!["IT資格", "語学", "プログラミング", ""];
    for name in &categories {
        sqlx::query!(
            r#"INSERT INTO t104_categories (name) VALUES (?)"#,
            name
        )
        .execute(pool)
        .await?;
    }

    let decks = vec![
        ("ネットワーク基礎", "IT資格", vec![
            ("OSI参照モデル", "7階層モデルのこと"),
            ("IPアドレス", "ネットワーク上の識別番号"),
            ("サブネットマスク", "ネットワーク部分とホスト部分の分割"),
            ("ルーティング", "経路制御の仕組み"),
            ("DNS", "名前解決サービス")
        ]),
        ("英単語 TOEIC", "語学", vec![
            ("apple", "リンゴ"),
            ("orange", "オレンジ"),
            ("book", "本")
        ]),
        ("Rust 基本文法", "プログラミング", vec![
            ("let 文", "変数を束縛する"),
            ("fn 関数", "関数定義")
        ]),
        ("未分類デッキ", "", vec![
            ("サンプル問題", "サンプル答え")
        ]),
    ];

    for (title, category_name, cards) in &decks {
        let category_id: Option<i64> = sqlx::query_scalar!(
            "SELECT id FROM t104_categories WHERE name = ?",
            category_name
        )
        .fetch_one(pool)
        .await
        .ok();

        let card_count = cards.len() as i64;

        let deck_id = sqlx::query!(
            r#"INSERT INTO t101_decks (title, card_count, category_id) VALUES (?, ?, ?)"#,
            title,
            card_count,
            category_id
        )
        .execute(pool)
        .await?
        .last_insert_rowid();

        // カード挿入
        for (front, back) in cards {
            sqlx::query!(
                r#"INSERT INTO t102_cards (deck_id, front, back) VALUES (?, ?, ?)"#,
                deck_id,
                front,
                back
            )
            .execute(pool)
            .await?;
        }

        // デッキ進捗初期化
        sqlx::query!(
            r#"INSERT INTO t103_deck_progress (deck_id, progress) VALUES (?, 0)"#,
            deck_id
        )
        .execute(pool)
        .await?;
    }

    // データ挿入後にフラグを true に更新
    sqlx::query!(
        r#"INSERT INTO t100_meta (key, value) VALUES ('db-init', true)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value"#  // 既に行があれば更新
    )
    .execute(pool)
    .await?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL not set");
    // async を同期世界で解決
    let pool = tauri::async_runtime::block_on(async {
        let pool = sqlite_pool(&database_url).await?;
        init_db(&pool).await?;
        Ok::<_, sqlx::Error>(pool)
    })?;

    tauri::Builder::default()
        .manage(pool)
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![save_deck,fetch_decks,get_deck_cards,update_deck])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
    Ok(())
}
