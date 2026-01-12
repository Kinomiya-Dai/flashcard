import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { invoke } from "@tauri-apps/api/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus, Trash2, GripVertical, Play, ArrowLeft } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";


interface DeckCard {
  id: string;
  front: string;
  back: string;
}

export interface DeckDetail {
  title: string;
  category_name: string | null;
  cards: DeckCard[];
}

function SortableCard({
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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`transition-shadow ${isDragging ? "-translate-y-1 shadow-xl z-50 relative" : ""
        }`}
    >
      <CardContent className="space-y-4 relative">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <GripVertical size={16} /> カード {index + 1}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium">表</label>
            <textarea
              className="min-h-[100px] w-full rounded-lg border p-2 text-sm"
              value={card.front}
              onChange={(e) =>
                onChange(card.id, "front", e.target.value)
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">裏</label>
            <textarea
              className="min-h-[100px] w-full rounded-lg border p-2 text-sm"
              value={card.back}
              onChange={(e) =>
                onChange(card.id, "back", e.target.value)
              }
            />
          </div>
        </div>

        <button
          onClick={() => onDelete(card.id)}
          className="absolute right-4 top-4 text-gray-400 hover:text-[#eb5556]"
        >
          <Trash2 size={16} />
        </button>
      </CardContent>
    </Card>
  );
}

export function EditCard() {
  const { id } = useParams();
  const deckId = Number(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const hasEmptyCard = cards.some(
    (c) => c.front.trim() === "" || c.back.trim() === ""
  );

  useEffect(() => {
    const loadDeck = async () => {
      try {
        console.log(category, typeof category);
        const deck = await invoke<DeckDetail>("get_deck_cards", {
          deckId,
        });


        setTitle(deck.title);
        setCategory(deck.category_name ?? "");
        setCards(
          deck.cards.map((c) => ({
            ...c,
            id: String(c.id),
          }))
        );
      } catch (e) {
        toast.error("デッキの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    loadDeck();
  }, [deckId]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setCards((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const updateDeck = async () => {
    console.log("deckId:", deckId, typeof deckId);

    console.log(
      "cards ids:",
      cards.map((c, index) => ({
        index,
        id: c.id,
        type: typeof c.id,
      }))
    );
    try {
      console.log(deckId);
      await invoke("update_deck", {
        payload: {
          deck_id: deckId,
          title,
          category,
          cards,
          card_count: cards.length,
        },
      });

      toast.success("更新しました");
    } catch (e) {
      console.error("デッキ更新エラー:", e);
      toast.error("更新に失敗しました");
    }
  };

  if (loading) return <p>loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 pb-28">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#2f4858]">
            デッキ編集
          </h1>
          <p className="text-sm text-[#45547e]">
            カード内容を編集できます
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft size={16} /> Home
          </Button>
          <Button onClick={() => navigate(`/play/${deckId}`)}>
            <Play size={16} /> play
          </Button>
        </div>
      </header>

      <Toaster position="bottom-right" />

      {/* タイトル・カテゴリ */}
      <Card className="mb-8">
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              カードタイトル
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              カテゴリ
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <section className="space-y-4">
            {cards.map((card, index) => (
              <SortableCard
                key={card.id}
                card={card}
                index={index}
                onChange={(id, key, value) =>
                  setCards((prev) =>
                    prev.map((c) =>
                      c.id === id ? { ...c, [key]: value } : c
                    )
                  )
                }
                onDelete={(id) =>
                  setCards((prev) =>
                    prev.filter((c) => c.id !== id)
                  )
                }
              />
            ))}
          </section>
        </SortableContext>
      </DndContext>

      <Button
        variant="outline"
        className="mt-4 w-full gap-2 border-dashed"
        onClick={() =>
          setCards((prev) => [
            ...prev,
            { id: crypto.randomUUID(), front: "", back: "" },
          ])
        }
      >
        <Plus size={16} /> カードを追加
      </Button>

      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-full px-3 sm:px-6 z-50">
        <div className="flex justify-end">
          <Button
            disabled={cards.length === 0 || hasEmptyCard}
            className="min-w-40 h-12 rounded-xl text-white
              bg-linear-to-r from-[#eb7e00] via-[#eb5556] to-[#c34c83]
              shadow-lg disabled:opacity-40"
            onClick={updateDeck}
          >
            更新する
          </Button>
        </div>
      </div>
    </div>
  );
}