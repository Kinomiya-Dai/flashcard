import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, RotateCcw } from "lucide-react";
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

  const handleGoToCard = (targetIndex: number) => {
    setCurrentIndex(targetIndex);
    setIsFlipped(false);
  };

  const getJumpButtons = () => {
    const buttons: number[] = [];
    let target = 10;
    while (target <= cards.length) {
      buttons.push(target);
      target += 10;
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
  const isLastCardBack = isLastCard && isFlipped;
  const jumpButtons = getJumpButtons();

  const getInstructionText = () => {
    if (isLastCardBack) {
      return "クリックで終了";
    }
    return "クリックでめくる";
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1f24] text-gray-200">
      <Toaster position="bottom-right" />

      <header className="hidden sm:flex px-6 py-4 items-center justify-between border-b border-[#2a2b31] bg-[#1f2026]">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-medium text-gray-100">{title}</h2>
          <div className="flex items-center gap-2">
            <span className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${isFlipped 
                ? "bg-[#eb7e00] text-white" 
                : "bg-[#3b82f6] text-white"
              }
            `}>
              {isFlipped ? "裏" : "表"}
            </span>
            <span className={`text-sm ${isLastCardBack ? "text-[#eb5556] font-medium" : "text-gray-400"}`}>
              {currentIndex + 1} / {cards.length} カード
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRestart}>
            <RotateCcw size={16} /> 最初から
          </Button>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft size={16} /> 終了
          </Button>
        </div>
      </header>

      {jumpButtons.length > 0 && (
        <div className="hidden sm:flex px-6 py-2 items-center gap-2 border-b border-[#2a2b31] bg-[#1f2026]">
          <span className="text-xs text-gray-400 mr-2">移動:</span>
          {jumpButtons.map((target) => (
            <button
              key={target}
              onClick={() => handleGoToCard(target - 1)}
              className={`
                px-3 py-1 rounded text-xs transition
                ${currentIndex === target - 1
                  ? "bg-[#444651] text-white"
                  : "text-gray-400 hover:text-gray-100 hover:bg-[#2a2c33]"
                }
              `}
            >
              {target}枚目
            </button>
          ))}
        </div>
      )}

      <div className="hidden sm:block w-full h-1 bg-[#2a2b31]">
        <div
          className={`h-full transition-all duration-300 ${
            isLastCardBack ? "bg-gradient-to-r from-[#eb7e00] via-[#eb5556] to-[#c34c83]" : "bg-[#444651]"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl flex flex-col items-center">
          <div className="sm:hidden w-full flex items-center justify-between mb-3 px-1">
            <span className={`
              px-2 py-0.5 rounded-full text-xs font-medium
              ${isFlipped 
                ? "bg-[#eb7e00] text-white" 
                : "bg-[#3b82f6] text-white"
              }
            `}>
              {isFlipped ? "裏" : "表"}
            </span>
            <span className={`text-xs ${isLastCardBack ? "text-[#eb5556] font-medium" : "text-gray-400"}`}>
              {currentIndex + 1} / {cards.length}
            </span>
          </div>

          <Card
            className={`
              w-full
              min-h-[200px] sm:min-h-[300px]
              cursor-pointer
              transition-all duration-300
              ${isLastCardBack
                ? "border-2 border-[#eb5556] bg-[#2a2630] shadow-lg shadow-[#eb5556]/10"
                : "border border-[#2a2b31] bg-[#25262c]"
              }
            `}
            onClick={handleCardClick}
          >
            <CardContent className="h-full min-h-[200px] sm:min-h-[300px] flex items-center justify-center p-4 sm:p-8">
              <p className="text-lg sm:text-xl text-center text-gray-100 whitespace-pre-wrap">
                {isFlipped ? currentCard.back : currentCard.front}
              </p>
            </CardContent>
          </Card>

          <p className={`text-xs sm:text-sm mt-4 sm:mt-6 ${isLastCardBack ? "text-[#eb5556] font-medium" : "text-gray-400"}`}>
            {getInstructionText()}
          </p>

          <div className="sm:hidden flex items-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={handleRestart}>
              <RotateCcw size={14} /> 最初から
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft size={14} /> 終了
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
