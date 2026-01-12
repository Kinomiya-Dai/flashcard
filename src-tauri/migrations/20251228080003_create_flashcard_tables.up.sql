-- Add up migration script here
PRAGMA foreign_keys;

/*
    #DB初期化フラグ
    key db-init
    value true / false
*/
CREATE TABLE IF NOT EXISTS t100_meta (
    key TEXT PRIMARY KEY,
    value BOOLEAN NOT NULL DEFAULT 0 --初期値true
);

-- デッキテーブル
CREATE TABLE t101_decks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    card_count INTEGER NOT NULL DEFAULT 0, -- カード枚数を保持
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES t104_categories(id)
);

-- 暗記カードテーブル
CREATE TABLE t102_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id INTEGER NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deck_id) REFERENCES t101_decks(id)
);

-- カード学習履歴テーブル
CREATE TABLE t103_deck_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deck_id INTEGER NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0, --どのカードまで学習したか。
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deck_id) REFERENCES t101_decks(id)
);

-- カテゴリテーブル
CREATE TABLE t104_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);