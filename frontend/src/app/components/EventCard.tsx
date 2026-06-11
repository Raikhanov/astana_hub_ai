import { Calendar, Clock, ExternalLink, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import type { HubEvent } from "../data/types";

const formatConfig = {
  Offline: { label: "Офлайн", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Online: { label: "Онлайн", className: "bg-blue-50 text-blue-700 border-blue-200" },
  Hybrid: { label: "Гибрид", className: "bg-purple-50 text-purple-700 border-purple-200" },
};

interface EventCardProps {
  event: HubEvent;
  compact?: boolean;
}

export function EventCard({ event, compact }: EventCardProps) {
  const fmt = formatConfig[event.format];
  const dateObj = new Date(event.date);
  const displayDate = Number.isNaN(dateObj.getTime())
    ? event.date
    : dateObj.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  return (
    <div className="bg-white border border-black/8 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md hover:shadow-black/5 transition-all hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <h3
          className="text-gray-900 leading-snug flex-1"
          style={{ fontSize: compact ? "14px" : "15px", fontWeight: 600 }}
        >
          {event.title}
        </h3>
        <span
          className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full border text-xs font-medium ${fmt.className}`}
        >
          {fmt.label}
        </span>
      </div>

      {!compact && (
        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="rounded-full bg-gray-50 px-2.5 py-1">{event.city}</span>
          <span className="rounded-full bg-gray-50 px-2.5 py-1">{event.hub}</span>
        </div>
      )}

      {!compact && (
        <div className="rounded-xl bg-gray-50/80 p-3 space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 shrink-0 text-primary" />
            <span>{displayDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 shrink-0 text-primary" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-primary mt-0.5" />
            <span>{event.address}</span>
          </div>
        </div>
      )}

      {!compact && (
        <div className="space-y-2">
          <p className="text-gray-500 leading-relaxed" style={{ fontSize: "13px" }}>
            <span className="font-semibold text-gray-700">Из поста:</span>{" "}
            {(event.description || "Описание в источнике.").replace(/\s+/g, " ").slice(0, 220)}
            {(event.description || "").replace(/\s+/g, " ").length > 220 ? "…" : ""}
          </p>
        </div>
      )}

      {!compact && event.tags && event.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {event.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full bg-gray-50 px-2 py-0.5 text-gray-500" style={{ fontSize: "11px" }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {!compact && (
        <Button
          variant="outline"
          className="mt-1 h-8 rounded-xl border-primary/30 text-primary hover:bg-primary/5"
          style={{ fontSize: "13px" }}
          onClick={() => event.sourceUrl && window.open(event.sourceUrl, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          Источник в Instagram
        </Button>
      )}
    </div>
  );
}
