import { Home, Calendar, Bot, Settings } from "lucide-react";

interface MobileNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenAssistant: () => void;
}

const items = [
  { label: "Главная", page: "home",   icon: Home     },
  { label: "События", page: "events", icon: Calendar  },
  { label: "Дашборд", page: "admin",  icon: Settings  },
];

export function MobileNav({ currentPage, onNavigate, onOpenAssistant }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white/90 backdrop-blur-md border-t border-black/8">
      <div className="flex items-stretch h-16">
        <NavItem item={items[0]} active={currentPage === items[0].page} onClick={() => onNavigate(items[0].page)} />
        <NavItem item={items[1]} active={currentPage === items[1].page} onClick={() => onNavigate(items[1].page)} />
        <div className="flex items-center justify-center flex-1">
          <button onClick={onOpenAssistant} className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 -mt-4">
            <Bot className="w-5 h-5 text-white" />
          </button>
        </div>
        <NavItem item={items[2]} active={currentPage === items[2].page} onClick={() => onNavigate(items[2].page)} />
        <div className="flex-1" />
      </div>
    </nav>
  );
}

function NavItem({ item, active, onClick }: { item: any; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${active ? "text-primary" : "text-gray-400"}`}>
      <item.icon className="w-5 h-5" />
      <span style={{ fontSize: "10px", fontWeight: active ? 600 : 400 }}>{item.label}</span>
    </button>
  );
}