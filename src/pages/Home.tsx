import { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  BookOpen,
  Play,
  MoreHorizontal,
  Trash
} from "lucide-react";
import { Toaster } from "react-hot-toast";
import { useDecks } from "../hooks/useDecks";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const { decks } = useDecks();

  const categories = [
    "All",
    ...Array.from(new Set(decks.map(d => d.category_name || "未分類")))
  ];

  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredDecks =
    selectedCategory === "All"
      ? decks
      : decks.filter(
        deck => (deck.category_name || "未分類") === selectedCategory
      );

  return (
    <div className="h-screen flex bg-[#1e1f24] text-gray-200">
      <Toaster position="bottom-right" />

      {/* ===== サイドバー ===== */}
      <aside className="
        w-56 shrink-0 flex flex-col
        border-r border-[#2a2b31]
        bg-[#25262c]
      ">
        <div className="px-4 py-4 border-b border-[#2a2b31]">
          <h1 className="text-lg font-semibold text-gray-100">
            暗記カード
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            デッキ管理
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {categories.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`
                  w-full text-left px-3 py-2 rounded-md text-sm transition
                  ${isActive
                    ? "bg-[#2f3138] text-gray-100 font-medium"
                    : "text-gray-400 hover:bg-[#2a2c33]"
                  }
                `}
              >
                {cat}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ===== メイン ===== */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* ヘッダー */}
        <header className="
          px-6 py-4 flex items-center justify-between
          border-b border-[#2a2b31]
          bg-[#1f2026]
        ">
          <div>
            <h2 className="text-lg font-medium text-gray-100">
              {selectedCategory}
            </h2>
            <p className="text-sm text-gray-400">
              {filteredDecks.length} 件のデッキ
            </p>
          </div>

          <Button
            className="
              gap-2
              bg-[#3a3c45] text-white
              hover:bg-[#444651]
            "
            onClick={() => navigate("/addDeck")}
          >
            新規デッキ
          </Button>
        </header>

        {/* ===== 一覧 ===== */}
        <section
          className="
            flex-1 overflow-y-auto
            px-6 py-4
            bg-[#1e1f24]
          "
        >
          <div className="flex flex-col gap-2">
            {filteredDecks.map(deck => (
              <Card
                key={deck.id}
                className="
                  group
                  border border-[#2a2b31]
                  bg-[#25262c]
                  hover:border-[#3a3c45]
                  hover:bg-[#262832]
                  transition
                "
              >
                <CardContent
                  className="
                    px-4 py-3
                    flex items-center gap-4
                  "
                >
                  {/* 左：情報 */}
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => navigate(`/card/${deck.id}`)}
                  >
                    <h3
                      className="
                        text-sm font-medium text-gray-100
                        truncate
                      "
                      title={deck.title}
                    >
                      {deck.title}
                    </h3>

                    <div
                      className="
                        mt-1 flex items-center gap-2
                        text-xs text-gray-400
                        truncate
                      "
                    >
                      <span className="truncate">
                        {deck.category_name || "未分類"}
                      </span>
                      <span>·</span>
                      <span>{deck.card_count} cards</span>
                    </div>
                  </div>

                  {/* 右：アクション */}
                  <div
                    className="
                      flex items-center gap-1
                      shrink-0
                      opacity-0 group-hover:opacity-100
                      transition
                    "
                  >
                    <button
                      onClick={() => navigate(`/play/${deck.id}`)}
                      className="
                        p-2 rounded-md
                        text-gray-400
                        hover:text-gray-100
                        hover:bg-[#2a2c33]
                      "
                    >
                      <Play size={14} />
                    </button>

                    <button
                      onClick={() => alert("削除")}
                      className="
                        p-2 rounded-md
                        text-gray-400
                        hover:text-red-400
                        hover:bg-[#2a2c33]
                      "
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;