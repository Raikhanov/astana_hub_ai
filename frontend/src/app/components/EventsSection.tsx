import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { CITIES, type EventFormat } from "../data/types";
import { EventCard } from "./EventCard";
import { fetchEvents } from "../lib/api";

const FORMAT_OPTIONS: { label: string; value: EventFormat | "Все" }[] = [
  { label: "Все форматы", value: "Все" },
  { label: "Offline",     value: "Offline" },
  { label: "Online",      value: "Online" },
  { label: "Hybrid",      value: "Hybrid" },
];

const INITIAL_COUNT = 6;

export function EventsSection() {
  const [selectedCity,   setSelectedCity]   = useState("Все города");
  const [selectedFormat, setSelectedFormat] = useState<EventFormat | "Все">("Все");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [events,         setEvents]         = useState([] as any[]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [hasError,       setHasError]       = useState(false);
  const [showAll,        setShowAll]        = useState(false);

  useEffect(() => {
    let ignore = false;
    const city   = selectedCity   === "Все города" ? "" : selectedCity;
    const format = selectedFormat === "Все"        ? "" : selectedFormat.toLowerCase();

    setIsLoading(true);
    setHasError(false);
    setShowAll(false);

    fetchEvents(city, format, searchQuery)
      .then(data => { if (!ignore) { setEvents(data); setIsLoading(false); } })
      .catch(()  => { if (!ignore) { setEvents([]); setHasError(true); setIsLoading(false); } });

    return () => { ignore = true; };
  }, [selectedCity, selectedFormat, searchQuery]);

  const filtered = events.filter(e => {
    const cityMatch   = selectedCity   === "Все города" || e.city   === selectedCity;
    const formatMatch = selectedFormat === "Все"        || e.format === selectedFormat;
    const searchMatch = !searchQuery
      || e.title?.toLowerCase().includes(searchQuery.toLowerCase())
      || e.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return cityMatch && formatMatch && searchMatch;
  });

  const displayed  = showAll ? filtered : filtered.slice(0, INITIAL_COUNT);
  const hasMore    = filtered.length > INITIAL_COUNT;

  return (
    <section className="py-16 px-4 sm:px-6 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">

        <div className="mb-10">
          <h2 className="text-gray-900 mb-2" style={{ fontSize: "24px", fontWeight: 700 }}>
            События из Instagram
          </h2>
          <p className="text-gray-500" style={{ fontSize: "15px" }}>
            Только публикации с подтверждённой ссылкой на первоисточник
          </p>
        </div>

        {/* Поиск */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-black/8 rounded-xl outline-none text-gray-900 placeholder:text-gray-400 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              style={{ fontSize: "14px" }}
            />
          </div>
        </div>

        {/* Фильтр по городу */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
          {CITIES.map(city => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`shrink-0 px-3.5 py-2 rounded-xl border transition-colors whitespace-nowrap ${
                selectedCity === city
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-600 border-black/8 hover:border-primary/40 hover:text-primary"
              }`}
              style={{ fontSize: "13px", fontWeight: 500 }}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Фильтр по формату */}
        <div className="flex gap-2 mb-8 items-center">
          {FORMAT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSelectedFormat(opt.value)}
              className={`px-3.5 py-1.5 rounded-full border transition-colors ${
                selectedFormat === opt.value
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-white text-gray-500 border-black/8 hover:border-gray-300"
              }`}
              style={{ fontSize: "13px", fontWeight: 500 }}
            >
              {opt.label}
            </button>
          ))}
          <span className="ml-auto text-gray-400 self-center" style={{ fontSize: "13px" }}>
            {filtered.length} мероприятий
          </span>
        </div>

        {/* Карточки */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Загрузка событий...</div>
        ) : hasError ? (
          <div className="text-center py-20 text-gray-400">Сервис временно недоступен.</div>
        ) : filtered.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayed.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {/* Кнопка показать все / свернуть */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setShowAll(v => !v)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white border border-black/8 rounded-xl text-gray-600 hover:border-primary/40 hover:text-primary transition-colors"
                  style={{ fontSize: "14px", fontWeight: 500 }}
                >
                  {showAll ? (
                    <><ChevronUp className="w-4 h-4" /> Свернуть</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" /> Показать все ({filtered.length})</>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <SlidersHorizontal className="w-10 h-10 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400" style={{ fontSize: "15px" }}>
              Мероприятий по выбранным фильтрам не найдено
            </p>
          </div>
        )}
      </div>
    </section>
  );
}