import { useEffect, useState } from "react";
import { Instagram, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
import { CITIES } from "../data/types";
import { fetchPeople } from "../lib/api";

const INITIAL_COUNT = 6;

const avatarColors = [
  "bg-blue-50 text-blue-700",
  "bg-purple-50 text-purple-700",
  "bg-emerald-50 text-emerald-700",
  "bg-orange-50 text-orange-700",
  "bg-rose-50 text-rose-700",
  "bg-cyan-50 text-cyan-700",
  "bg-amber-50 text-amber-700",
  "bg-indigo-50 text-indigo-700",
];

export function TeamSection() {
  const [selectedCity, setSelectedCity] = useState("Все города");
  const [teamMembers, setTeamMembers] = useState([] as any[]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const city = selectedCity === "Все города" ? "" : selectedCity;
    setIsLoading(true);
    setShowAll(false);
    fetchPeople(city).then((data) => {
      setTeamMembers(data);
      setIsLoading(false);
    });
  }, [selectedCity]);

  const displayed = showAll ? teamMembers : teamMembers.slice(0, INITIAL_COUNT);
  const hasMore = teamMembers.length > INITIAL_COUNT;

  return (
    <section className="py-16 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h2
            className="text-gray-900 mb-2"
            style={{ fontSize: "24px", fontWeight: 700 }}
          >
            Команда хабов
          </h2>
          <p className="text-gray-500" style={{ fontSize: "15px" }}>
            Руководители и менеджеры региональных хабов
          </p>
        </div>

        {/* Фильтр по городу */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-8 scrollbar-none">
          {CITIES.map((city) => (
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

        {isLoading ? (
          <div className="text-center py-16 text-gray-400">
            Загрузка сотрудников...
          </div>
        ) : displayed.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayed.map((member, idx) => (
                <div
                  key={member.id}
                  className="bg-white border border-black/8 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md hover:shadow-black/5 transition-all hover:-translate-y-0.5"
                >
                  {/* Аватар + имя */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                        avatarColors[idx % avatarColors.length]
                      }`}
                      style={{ fontSize: "18px", fontWeight: 700 }}
                    >
                      {member.avatar}
                    </div>
                    <div className="min-w-0">
                      <div
                        className="text-gray-900 truncate"
                        style={{ fontSize: "15px", fontWeight: 600 }}
                      >
                        {member.name}
                      </div>
                      <div className="text-gray-500" style={{ fontSize: "13px" }}>
                        {member.role}
                      </div>
                      <div
                        className="flex items-center gap-1 mt-0.5 text-primary"
                        style={{ fontSize: "12px" }}
                      >
                        <MapPin className="w-3 h-3 shrink-0" />
                        {member.hub}
                      </div>
                    </div>
                  </div>

                  {/* Контакт — Instagram */}
                  {member.instagramHandle && (
                    <a
                      href={member.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors"
                      style={{ fontSize: "13px" }}
                    >
                      <Instagram className="w-3.5 h-3.5 shrink-0 text-primary" />
                      <span>{member.instagramHandle}</span>
                    </a>
                  )}

                  <Button
                    variant="outline"
                    className="h-8 rounded-xl border-primary/30 text-primary hover:bg-primary/5 mt-auto"
                    style={{ fontSize: "12px" }}
                    onClick={() =>
                      member.sourceUrl &&
                      window.open(member.sourceUrl, "_blank", "noopener,noreferrer")
                    }
                  >
                    <Instagram className="w-3.5 h-3.5 mr-1.5" />
                    Открыть Instagram
                  </Button>
                </div>
              ))}
            </div>

            {/* Кнопка показать все / свернуть */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white border border-black/8 rounded-xl text-gray-600 hover:border-primary/40 hover:text-primary transition-colors"
                  style={{ fontSize: "14px", fontWeight: 500 }}
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-4 h-4" /> Свернуть
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" /> Показать все (
                      {teamMembers.length})
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-gray-400">
            Нет данных по выбранному городу.
          </div>
        )}
      </div>
    </section>
  );
}
