import { useState } from "react";
import { ArrowRight, Sparkles, Search } from "lucide-react";
import { Button } from "./ui/button";

const suggestions = [
  "Какие мероприятия будут в Таразе?",
  "Кто директор Тараз Hub?",
  "Есть ли онлайн обучение в Шымкенте?",
  "С кем связаться по обучению?",
];

interface HeroSectionProps {
  onSendMessage: (msg: string) => void;
  onOpenAssistant: () => void;
}

export function HeroSection({ onSendMessage, onOpenAssistant }: HeroSectionProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSendMessage(query.trim());
      onOpenAssistant();
      setQuery("");
    }
  };

  const handleSuggestion = (s: string) => {
    onSendMessage(s);
    onOpenAssistant();
  };

  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-24 px-4 sm:px-6">
      {/* Background decoration */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37,99,235,0.07) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-4xl mx-auto relative text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-primary/8 text-primary rounded-full px-4 py-1.5 mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span style={{ fontSize: "13px", fontWeight: 500 }}>
            AI-ассистент для хабов Казахстана
          </span>
        </div>

        {/* Heading */}
        <h1
          className="text-gray-900 mb-5 leading-tight tracking-tight"
          style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 800 }}
        >
          Найдите события и контакты{" "}
          <span className="text-primary">региональных хабов</span> Казахстана
        </h1>

        <p
          className="text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed"
          style={{ fontSize: "clamp(15px, 2vw, 18px)" }}
        >
          Проект для поиска актуальных событий, обучения и контактов региональных хабов Казахстана.
          Можно быстро найти мероприятие по городу, теме или формату.
        </p>

        {/* Chat input */}
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto mb-6">
          <div className="relative flex items-center bg-white rounded-2xl border border-black/10 shadow-lg shadow-black/5 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
            <Search className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Введите город или задайте вопрос..."
              className="flex-1 bg-transparent pl-12 pr-4 py-4 outline-none text-gray-900 placeholder:text-gray-400"
              style={{ fontSize: "15px" }}
            />
            <Button
              type="submit"
              disabled={!query.trim()}
              className="m-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-5 gap-2 shrink-0 disabled:opacity-40"
              style={{ fontSize: "14px" }}
            >
              Спросить
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Suggestions */}
        <div className="flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              className="bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded-full px-4 py-2 border border-black/8 transition-colors"
              style={{ fontSize: "13px" }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
