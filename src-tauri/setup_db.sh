#!/bin/bash
set -e  # エラーで停止

# 1. DBディレクトリの作成
DB_DIR="./db"
DB_FILE="$DB_DIR/database.db"

if [ ! -d "$DB_DIR" ]; then
    echo "Creating directory $DB_DIR..."
    mkdir -p "$DB_DIR"
fi

# 2. DATABASE_URL 環境変数の設定
export DATABASE_URL="sqlite:$DB_FILE"
echo "Using DATABASE_URL=$DATABASE_URL"

# 3. DB ファイルの作成確認（SQLiteは存在しなければ自動生成される）
if [ ! -f "$DB_FILE" ]; then
    echo "Database file $DB_FILE does not exist. It will be created automatically by SQLite."
    sqlx database create
fi

# 4. マイグレーションの実行
echo "Running SQLx migrations..."
sqlx migrate run

echo "Database setup complete!"