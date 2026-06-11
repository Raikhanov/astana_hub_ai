export type EventFormat = "Offline" | "Online" | "Hybrid";
export type EventStatus = "Upcoming" | "Ongoing" | "Completed";

export interface HubEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  format: EventFormat;
  city: string;
  address: string;
  description: string;
  status: EventStatus;
  hub: string;
  tags?: string[];
  sourceUrl?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  city: string;
  avatar: string;
  hub: string;
  sourceUrl?: string;
}

export const CITIES = [
  "Все города",
  "Astana",
  "Kyzylorda",
  "Zhambyl",
  "Almaty",
  "Atyrau",
  "Pavlodar",
  "Uralsk",
  "Oskemen",
  "Jetisu",
  "Shymkent",
  "Alatau",
  "Mangystau",
  "Turkistan",
  "Ulytau",
  "Aqtobe",
  "Aqmola",
  "Petropavl",
];
