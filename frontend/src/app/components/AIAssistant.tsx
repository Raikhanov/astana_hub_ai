import { useState, useRef, useEffect } from "react";
import { Bot, Send, X, User, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { CITIES } from "../data/types";
import { askAssistant } from "../lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  text: "Напишите город или задайте вопрос о событиях и сотрудниках хабов Казахстана.",
};

const QUICK_QUESTIONS = [
  "Мероприятия в Таразе",
  "Кто директор Atyrau Hub?",
  "Онлайн-обучение в Астане",
  "С кем связаться по обучению?",
];

interface AIAssistantProps {
  initialMessage?: string;
  onClose?: () => void;
  embedded?: boolean;
}

export function AIAssistant({ initialMessage, onClose, embedded }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [city, setCity] = useState("Все города");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasProcessedInitial = useRef(false);

  useEffect(() => {
    if (initialMessage && !hasProcessedInitial.current) {
      hasProcessedInitial.current = true;
      sendMessage(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: "user", text };
    // Передаём город напрямую — бэкенд сам определит через detectCity
    const selectedCity = city === "Все города" ? "" : city;

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await askAssistant(text, selectedCity);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: response.text,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "Не удалось получить ответ. Попробуйте позже.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isTyping) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  const renderText = (text: string) => {
    return text.split("\n").map((line, lineIndex) => (
      <span key={`line-${lineIndex}`}>
        {line.split("**").map((part, i) =>
          i % 2 === 1 ? (
            <strong key={i} className="text-gray-900 font-semibold">
              {part}
            </strong>
          ) : (
            part
          )
        )}
        {lineIndex < text.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  const wrapperClass = embedded
    ? "flex flex-col h-full"
    : "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/30 backdrop-blur-sm";

  const panelClass = embedded
    ? "flex flex-col h-full bg-white"
    : "w-full sm:w-[480px] sm:max-h-[80vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden";

  return (
    <div
      className={wrapperClass}
      onClick={!embedded ? (e) => e.target === e.currentTarget && onClose?.() : undefined}
    >
      <div className={panelClass}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-gray-900" style={{ fontSize: "14px", fontWeight: 600 }}>
                Hub Events AI
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span className="text-gray-400" style={{ fontSize: "12px" }}>Онлайн</span>
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 min-h-0">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === "user" ? "bg-primary" : "bg-gray-100"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                )}
              </div>

              <div
                className={`flex flex-col gap-2 max-w-[85%] ${
                  msg.role === "user" ? "items-end" : ""
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-tr-sm"
                      : "bg-gray-50 text-gray-700 rounded-tl-sm"
                  }`}
                  style={{ fontSize: "14px", lineHeight: "1.7" }}
                >
                  {renderText(msg.text)}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick questions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2 shrink-0">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="bg-gray-50 hover:bg-gray-100 text-gray-600 border border-black/8 rounded-full px-3 py-1 transition-colors"
                style={{ fontSize: "12px" }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* City selector + Input */}
        <div className="border-t border-black/5 shrink-0">
          <div className="px-4 pt-3">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-gray-50 border border-black/8 rounded-xl px-3 py-2 outline-none text-gray-700 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              style={{ fontSize: "13px" }}
            >
              {CITIES.map((item) => (
                <option key={item} value={item}>
                  {item === "Все города" ? "Поиск по всем хабам" : item}
                </option>
              ))}
            </select>
          </div>
          <form onSubmit={handleSubmit} className="px-4 py-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишите сообщение..."
              disabled={isTyping}
              className="flex-1 min-w-0 bg-gray-50 border border-black/8 rounded-xl px-4 py-2.5 outline-none text-gray-900 placeholder:text-gray-400 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-60"
              style={{ fontSize: "14px" }}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 p-0 bg-primary hover:bg-primary/90 text-white rounded-xl disabled:opacity-40 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
