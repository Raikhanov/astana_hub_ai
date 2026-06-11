import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  Calendar,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { fetchEvents, fetchNotifications, fetchStats, syncInstagram } from "../lib/api";
import type { HubEvent } from "../data/types";

const statusConfig = {
  Upcoming: { label: "Предстоит", icon: Clock, className: "text-amber-600 bg-amber-50" },
  Ongoing: { label: "Идёт", icon: AlertCircle, className: "text-blue-600 bg-blue-50" },
  Completed: { label: "Завершено", icon: CheckCircle2, className: "text-emerald-600 bg-emerald-50" },
};

const formatConfig = {
  Offline: "bg-emerald-50 text-emerald-700",
  Online: "bg-blue-50 text-blue-700",
  Hybrid: "bg-purple-50 text-purple-700",
};

export function AdminDashboard() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [events, setEvents] = useState<HubEvent[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const loadDashboard = async () => {
    const [nextEvents, nextStats, nextNotifications] = await Promise.all([
      fetchEvents(),
      fetchStats(),
      fetchNotifications(),
    ]);
    setEvents(nextEvents);
    setStats(nextStats);
    setNotifications(nextNotifications);
    if (nextStats?.lastUpdated) setLastSync(nextStats.lastUpdated);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncInstagram();
      await loadDashboard();
      setLastSync(new Date().toISOString());
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <section className="py-16 px-4 sm:px-6 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-gray-900 mb-1" style={{ fontSize: "24px", fontWeight: 700 }}>
              Dashboard
            </h2>
            <p className="text-gray-500 flex items-center gap-2" style={{ fontSize: "13px" }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Последнее обновление: {lastSync ? formatDate(lastSync) : "нет данных"}
            </p>
          </div>
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-5"
            style={{ fontSize: "14px" }}
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Обновление..." : "Обновить данные Instagram"}
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Всего хабов", value: stats?.totalHubs ?? 0, icon: Building2, color: "text-blue-600 bg-blue-50" },
            { label: "Постов-событий", value: stats?.totalEvents ?? 0, icon: Calendar, color: "text-emerald-600 bg-emerald-50" },
            { label: "С источником", value: events.filter((e) => Boolean(e.sourceUrl)).length, icon: TrendingUp, color: "text-amber-600 bg-amber-50" },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white border border-black/8 rounded-2xl p-5 flex flex-col gap-3"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-gray-900" style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1 }}>
                  {card.value}
                </div>
                <div className="text-gray-500 mt-1" style={{ fontSize: "13px" }}>
                  {card.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {notifications.length > 0 && (
          <div className="bg-white border border-black/8 rounded-2xl p-5 mb-10">
            <h3 className="text-gray-900 mb-3" style={{ fontSize: "15px", fontWeight: 600 }}>
              Уведомления о новых событиях
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {notifications.map((item) => (
                <div key={item.id} className="rounded-xl bg-gray-50 px-3 py-2 text-gray-600" style={{ fontSize: "13px" }}>
                  {item.title} · {item.city} · {item.date}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events table */}
        <div className="bg-white border border-black/8 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
            <h3 className="text-gray-900" style={{ fontSize: "15px", fontWeight: 600 }}>
              Все мероприятия
            </h3>
            <span className="text-gray-400 bg-gray-50 rounded-full px-3 py-1" style={{ fontSize: "12px" }}>
              {events.length} записей
            </span>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 bg-gray-50/50">
                  {["Город", "Название события", "Дата", "Формат", "Статус"].map((col) => (
                    <th
                      key={col}
                      className="text-left px-6 py-3 text-gray-400"
                      style={{ fontSize: "12px", fontWeight: 600 }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map((event, i) => {
                  const status = statusConfig[event.status];
                  const StatusIcon = status.icon;
                  return (
                    <tr
                      key={event.id}
                      className={`border-b border-black/4 hover:bg-gray-50/50 transition-colors ${
                        i === events.length - 1 ? "border-none" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-gray-700" style={{ fontSize: "13px" }}>
                          {event.city}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div>
                          <div className="text-gray-900" style={{ fontSize: "13px", fontWeight: 500 }}>
                            {event.title}
                          </div>
                          <div className="text-gray-400" style={{ fontSize: "12px" }}>
                            {event.hub}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-700" style={{ fontSize: "13px" }}>
                          {new Date(event.date).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "short",
                          })}
                        </div>
                        <div className="text-gray-400" style={{ fontSize: "12px" }}>
                          {event.time}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            formatConfig[event.format]
                          }`}
                        >
                          {event.format}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-black/5">
            {events.map((event) => {
              const status = statusConfig[event.status];
              const StatusIcon = status.icon;
              return (
                <div key={event.id} className="px-4 py-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-gray-900" style={{ fontSize: "13px", fontWeight: 500 }}>
                        {event.title}
                      </div>
                      <div className="text-gray-400" style={{ fontSize: "12px" }}>
                        {event.city} · {event.hub}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        formatConfig[event.format]
                      }`}
                    >
                      {event.format}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500" style={{ fontSize: "12px" }}>
                      {new Date(event.date).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      · {event.time}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
