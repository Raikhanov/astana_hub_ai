import { useState } from "react";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { EventsSection } from "./components/EventsSection";
import { AIAssistant } from "./components/AIAssistant";
import { AdminDashboard } from "./components/AdminDashboard";
import { MobileNav } from "./components/MobileNav";
import { Bot, Instagram, Globe, Zap, Shield } from "lucide-react";
import { fetchHubs } from "./lib/api";
import { useEffect, useState as useS } from "react";

type Page = "home" | "events" | "admin" | "hubs";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | undefined>();

  const openAssistant = (msg?: string) => {
    setInitialMessage(msg);
    setAssistantOpen(true);
  };

  const renderPage = () => {
    switch (page) {
      case "events": return <EventsSection />;
      case "admin":  return <AdminDashboard />;
      case "hubs":   return <HubsPage onNavigate={setPage} />;
      default:
        return (
          <>
            <HeroSection
              onSendMessage={(msg) => openAssistant(msg)}
              onOpenAssistant={() => openAssistant()}
            />
            <EventsSection />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header
        onOpenAssistant={() => openAssistant()}
        currentPage={page}
        onNavigate={(p) => setPage(p as Page)}
      />
      <main className="flex-1 pb-16 md:pb-0">{renderPage()}</main>
      <Footer onNavigate={setPage} />
      <MobileNav
        currentPage={page}
        onNavigate={(p) => setPage(p as Page)}
        onOpenAssistant={() => openAssistant()}
      />
      {assistantOpen && (
        <AIAssistant
          initialMessage={initialMessage}
          onClose={() => {
            setAssistantOpen(false);
            setInitialMessage(undefined);
          }}
        />
      )}
    </div>
  );
}

// ── Hubs page ──────────────────────────────────────────────────────────────
function HubsPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [hubs, setHubs] = useS([] as any[]);
  const [isLoading, setIsLoading] = useS(true);

  useEffect(() => {
    setIsLoading(true);
    fetchHubs().then((data) => { setHubs(data); setIsLoading(false); });
  }, []);

  return (
    <section className="py-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h2 className="text-gray-900 mb-2" style={{ fontSize: "24px", fontWeight: 700 }}>
            Региональные хабы
          </h2>
          <p className="text-gray-500" style={{ fontSize: "15px" }}>
            Аккаунты и счётчики из последней выгрузки Instagram
          </p>
        </div>
        {isLoading ? (
          <div className="text-center py-16 text-gray-400">Загрузка хабов...</div>
        ) : hubs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hubs.map((hub: any) => (
              <div key={hub.city} className="bg-white border border-black/8 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-gray-900" style={{ fontSize: "15px", fontWeight: 600 }}>{hub.name}</div>
                    <div className="text-gray-500" style={{ fontSize: "13px" }}>{hub.city}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-500" style={{ fontSize: "13px" }}>
                  <Instagram className="w-3.5 h-3.5 text-primary shrink-0" />
                  <a href={hub.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-primary">
                    {hub.instagram}
                  </a>
                </div>
                <div className="flex gap-3 pt-1 border-t border-black/5">
                  <div className="flex-1 text-center">
                    <div className="text-gray-900" style={{ fontSize: "20px", fontWeight: 700 }}>{hub.members}</div>
                    <div className="text-gray-400" style={{ fontSize: "11px" }}>сотрудников</div>
                  </div>
                  <div className="w-px bg-black/5" />
                  <div className="flex-1 text-center">
                    <div className="text-gray-900" style={{ fontSize: "20px", fontWeight: 700 }}>{hub.events}</div>
                    <div className="text-gray-400" style={{ fontSize: "11px" }}>событий</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">Нет данных по хабам.</div>
        )}
      </div>
    </section>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer({ onNavigate }: { onNavigate: (p: Page) => void }) {
  return (
    <footer className="hidden md:block border-t border-black/5 py-8 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-primary flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-gray-600" style={{ fontSize: "14px" }}>
            Hub Events <strong>AI</strong> — Казахстан, 2025
          </span>
        </div>
        <div className="flex gap-5">
          {[
            { label: "События",   page: "events" as Page },
            { label: "Хабы",      page: "hubs"   as Page },
            { label: "Dashboard", page: "admin"  as Page },
          ].map((item) => (
            <button
              key={item.page}
              onClick={() => onNavigate(item.page)}
              className="text-gray-400 hover:text-gray-700 transition-colors"
              style={{ fontSize: "13px" }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}