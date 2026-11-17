export type ProjectCategory =
  | "Site Vitrine"
  | "E-Commerce"
  | "Application Web"
  | "Portail & Blog";

export interface Article {
  id: string;
  title: string;
  content: string; // supports Markdown formatting
  category: "Conseil" | "Méthode";
  imageUrl?: string; // URL or compressed Data URL for cover illustration
  createdAt: string;
  updatedAt: string;
  views: number;
  readTime: string; // e.g. "5 min"
  author: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  client: string;
  year: string;
  imageUrl: string;
  liveUrl?: string;
  technologies?: string[];
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VisitStats {
  id: string; // "global"
  totalVisits: number;
  lastUpdated: string;
}

export interface DailyVisit {
  id: string; // formatted date or weekday
  count: number;
  lastUpdated: string;
}
