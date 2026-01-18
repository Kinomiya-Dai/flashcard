import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, RotateCcw, ChevronLeft } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

interface DeckCard {
  id: string;
  front: string;
  back: string;
}

interface DeckDetail {
  title: string;
  category_name: string | null;
  cards: DeckCard[];
}

export function PlayDeck() {
  const { id } = useParams();
  const deckId = Number(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const loadDeck = async () => {
      try {
        const deck = await invoke<DeckDetail>("get_deck_cards", {
          deckId,
        });

        setTitle(deck.title);
        setCards(
          deck.cards.map((c) => ({
            ...c,
            id: String(c.id),
          }))
        );
      } catch {
        toast.error("デッキの取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    loadDeck();
  }, [deckId]);

  const handleCardClick = () => {
    if (!isFlipped) {
      setIsFlipped(true);
    } else {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        navigate("/");
      }
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleGoBack = (steps: number) => {
    const newIndex = Math.max(0, currentIndex - steps);
    setCurrentIndex(newIndex);
    setIsFlipped(false);
  };

  const getBackButtons = () => {
    const buttons: number[] = [];
    let step = 10;
    while (step <= currentIndex) {
      buttons.push(step);
      step += 10;
    }
    return buttons;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1e1f24] text-gray-200">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#1e1f24] text-gray-200 gap-4">
        <p>このデッキにはカードがありません</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft size={16} /> ホームに戻る
        </Button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;
  const isLastCard = currentIndex === cards.length - 1;
  const backButtons = getBackButtons();

  const getInstructionText = () => {
    if (!isFlipped) {
      return "クリックでめくる";
    }
    return isLastCard ? "クリックで終了" : "クリックで次のカードへ";
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1f24] text-gray-200">
      <Toaster position="bottom-right" />

      <header className="px-6 py-4 flex items-center justify-between border-b border-[#2a2b31] bg-[#1f2026]">
        <div>
          <h2 className="text-lg font-medium text-gray-100">{title}</h2>
        </div>

        <div className="flex items-center gap-2">
          {backButtons.map((step) => (
            <Button
              key={step}
              variant="ghost"
              size="sm"
              onClick={() => handleGoBack(step)}
              className="text-gray-400 hover:text-gray-100"
            >
              <ChevronLeft size={14} />
              {step}
            </Button>
          ))}
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw size={16} /> 最初から
          </Button>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft size={16} /> 終了
          </Button>
        </div>
      </header>

      <div className="w-full h-1 bg-[#2a2b31]">
        <div
          className={`h-full transition-all duration-300 ${
            isLastCard ? "bg-gradient-to-r from-[#eb7e00] via-[#eb5556] to-[#c34c83]" : "bg-[#444651]"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl flex flex-col items-center">
          <div className="w-full flex items-center justify-center mb-4 gap-3">
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${isFlipped 
                ? "bg-[#3a3c45] text-gray-100" 
                : "bg-[#444651] text-white"
              }
            `}>
              {isFlipped ? "裏" : "表"}
            </span>
            <span className={`text-sm ${isLastCard ? "text-[#eb5556] font-medium" : "text-gray-400"}`}>
              {currentIndex + 1} / {cards.length} カード
              {isLastCard && " (最後)"}
            </span>
          </div>

          <Card
            className={`
              w-full
              min-h-[300px]
              cursor-pointer
              transition-all duration-300
              ${isLastCard
                ? "border-2 border-[#eb5556] bg-[#2a2630] hover:border-[#eb7e00] hover:bg-[#2d2835] shadow-lg shadow-[#eb5556]/10"
                : "border border-[#2a2b31] bg-[#25262c] hover:border-[#3a3c45] hover:bg-[#262832]"
              }
            `}
            onClick={handleCardClick}
          >
            <CardContent className="h-full min-h-[300px] flex items-center justify-center p-8">
              <p className="text-xl text-center text-gray-100 whitespace-pre-wrap">
                {isFlipped ? currentCard.back : currentCard.front}
              </p>
            </CardContent>
          </Card>

          <p className="text-sm text-gray-400 mt-6">
            {getInstructionText()}
          </p>
        </div>
      </main>
    </div>
  );
}
