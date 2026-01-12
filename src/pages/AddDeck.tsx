import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

interface DeckCard {
  id: string;
  front: string;
  back: string;
}

function DeckCardItem({
  card,
  index,
  onChange,
  onDelete,
}: {
  card: DeckCard;
  index: number;
  onChange: (id: string, key: "front" | "back", value: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="group transition-shadow">
      <CardContent className="relative space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          カード {index + 1}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block mb-1 text-xs font-medium text-gray-300">表</label>
            <textarea
              className="min-h-[80px] w-full rounded-lg border border-[#3a3c45] bg-[#1e1f24] p-2 text-sm text-[#e5e7eb] placeholder-gray-500 resize-none focus:outline-none focus:border-[#444651] focus:ring-1 focus:ring-[#444651]"
              placeholder="表面の内容"
              value={card.front}
              onChange={(e) => onChange(card.id, "front", e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-medium text-gray-300">裏</label>
            <textarea
              className="min-h-[80px] w-full rounded-lg border border-[#3a3c45] bg-[#1e1f24] p-2 text-sm text-[#e5e7eb] placeholder-gray-500 resize-none focus:outline-none focus:border-[#444651] focus:ring-1 focus:ring-[#444651]"
              placeholder="裏面の内容"
              value={card.back}
              onChange={(e) => onChange(card.id, "back", e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={() => onDelete(card.id)}
          className="absolute right-3 top-3 text-gray-400 hover:text-[#eb5556] opacity-0 group-hover:opacity-100 transition"
        >
          <Trash2 size={16} />
        </button>
      </CardContent>
    </Card>
  );
}

export default function AddDeck() {
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const endRef = useRef<HTMLDivElement>(null);

  const hasEmptyCard = cards.some(c => c.front.trim() === "" || c.back.trim() === "");
  const CARDS_PER_PAGE = 10;
  const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);
  const currentCards = cards.slice(page * CARDS_PER_PAGE, (page + 1) * CARDS_PER_PAGE);

  const addCard = () => {
    setCards(prev => [...prev, { id: crypto.randomUUID(), front: "", back: "" }]);
    if ((cards.length + 1) > CARDS_PER_PAGE * (page + 1)) {
      setPage(page + 1);
    }
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const saveDeck = async () => {
    if (!title.trim()) return toast.error("タイトルを入力してください");
    try {
      await invoke("save_deck", { payload: { title, category, cards, card_count: cards.length } });
      toast.success("デッキを作成しました！", { duration: 3000, position: "bottom-right" });
      navigate("/");
    } catch {
      toast.error("保存に失敗しました。再試行してください。", { duration: 5000, position: "bottom-right" });
    }
  };

  const prevCardsLength = useRef(cards.length);
  useEffect(() => {
    if (cards.length > prevCardsLength.current) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevCardsLength.current = cards.length;
  }, [cards]);

  return (
    <div className="flex h-screen bg-[#1e1f24] text-gray-200">
      <Toaster position="bottom-right" />

      {/* ===== 左ナビゲーション (固定) ===== */}
      <aside className="w-80 flex-shrink-0 flex flex-col border-r border-[#2a2b31] px-4 py-6 h-screen sticky top-0">
        <div className="space-y-6 flex flex-col h-full">
          {/* ヘッダー */}
          <div>
            <h1 className="text-xl font-bold text-gray-100 mb-1">新規デッキ作成</h1>
            <p className="text-sm text-gray-400">カードを追加して学習デッキを作成します</p>
          </div>

          {/* デッキ情報 */}
          <Card className="shadow-md">
            <CardContent className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-300">デッキタイトル</label>
                <input
                  className="w-full rounded-lg border border-[#3a3c45] bg-[#1e1f24] px-3 py-2 text-sm text-[#e5e7eb] placeholder-gray-500 focus:outline-none focus:border-[#444651] focus:ring-1 focus:ring-[#444651]"
                  placeholder="例：Rust 基本文法"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-300">カテゴリ</label>
                <input
                  list="category-list"
                  className="w-full rounded-lg border border-[#3a3c45] bg-[#1e1f24] px-3 py-2 text-sm text-[#e5e7eb] placeholder-gray-500 focus:outline-none focus:border-[#444651] focus:ring-1 focus:ring-[#444651]"
                  placeholder="カテゴリを入力または選択"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
                <datalist id="category-list">
                  <option value="プログラミング" />
                  <option value="資格" />
                  <option value="語学" />
                </datalist>
              </div>
            </CardContent>
          </Card>

          {/* カード操作 */}
          <div className="space-y-3">
            <Button onClick={addCard} variant="outline" className="w-full gap-2 border-dashed">
              <Plus size={16} /> カードを追加
            </Button>
            <div className="flex justify-between items-center">
              <Button
                onClick={() => setPage(p => Math.max(p - 1, 0))}
                disabled={page === 0}
                variant="outline"
                className="px-3 py-2"
              >
                前のページ
              </Button>
              <span className="text-gray-300">{page + 1} / {totalPages}</span>
              <Button
                onClick={() => setPage(p => Math.min(p + 1, totalPages - 1))}
                disabled={page === totalPages - 1}
                variant="outline"
                className="px-3 py-2"
              >
                次のページ
              </Button>
            </div>
            <Button
              disabled={cards.length === 0 || hasEmptyCard}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#3a3c45] via-[#444651] to-[#3f4253] text-white font-semibold hover:from-[#4b4d58] hover:via-[#56585f] hover:to-[#5c5e67] transition-all"
              onClick={saveDeck}
            >
              デッキを保存
            </Button>
          </div>

          <Button variant="outline" onClick={() => navigate("/")} className="mt-auto w-full gap-2">
            <ArrowLeft size={16} /> Home
          </Button>
        </div>
      </aside>

      {/* ===== 右カード一覧 (スクロール可能) ===== */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="
          px-6 py-4 flex items-center justify-between
          border-b border-[#2a2b31]
          bg-[#1f2026]
        ">
          <div></div>
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

        <section
          className="
            flex-1 overflow-y-auto
            px-6 py-4
            bg-[#1e1f24]
          "
        >
          <div className="flex flex-col gap-4">
            {currentCards.length === 0 && (
              <Card className="border-dashed text-center">
                <CardContent className="py-12 text-sm text-gray-400">
                  まだカードがありません。<br />
                  左の「カードを追加」ボタンから作成できます。
                </CardContent>
              </Card>
            )}
            {currentCards.map((card, idx) => (
              <DeckCardItem
                key={card.id}
                card={card}
                index={page * CARDS_PER_PAGE + idx}
                onChange={(id, key, value) =>
                  setCards(prev => prev.map(c => (c.id === id ? { ...c, [key]: value } : c)))
                }
                onDelete={(id) => setCards(prev => prev.filter(c => c.id !== id))}
              />
            ))}
          </div>
          <div ref={endRef}></div>
        </section>

      </main>
    </div>
  );
}