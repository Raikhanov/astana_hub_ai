import { useState } from "react";
import { Bot, Menu, X } from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  onOpenAssistant: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

const navItems = [
  { label: "События", page: "events" },
  { label: "Хабы",    page: "hubs"   },
  { label: "Dashboard", page: "admin" },
];

export function Header({ onOpenAssistant, currentPage, onNavigate }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button onClick={() => onNavigate("home")} className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-900 hidden sm:block" style={{ fontSize: "15px", fontWeight: 600 }}>
            Hub Events <span className="text-primary">AI</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                currentPage === item.page
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
              style={{ fontSize: "14px", fontWeight: 500 }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            onClick={onOpenAssistant}
            className="hidden sm:flex gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl px-4 h-9"
            style={{ fontSize: "14px" }}
          >
            <Bot className="w-4 h-4" />
            Открыть ассистента
          </Button>
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-black/5 bg-white px-4 pb-4 pt-2 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => { onNavigate(item.page); setMobileOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                currentPage === item.page ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-100"
              }`}
              style={{ fontSize: "14px" }}
            >
              {item.label}
            </button>
          ))}
          <Button onClick={() => { onOpenAssistant(); setMobileOpen(false); }}
            className="mt-2 gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl">
            <Bot className="w-4 h-4" /> Открыть ассистента
          </Button>
        </div>
      )}
    </header>
  );
}