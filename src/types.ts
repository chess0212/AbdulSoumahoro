export interface Article {
  id: string;
  title: string;
  content: string; // supports Markdown formatting
  category: "Conseil" | "Méthode";
  createdAt: any; // Firestore Timestamp or string representation
  updatedAt: any; // Firestore Timestamp or string representation
  views: number;
  readTime: string; // e.g. "5 min"
  author: string;
}

export interface VisitStats {
  id: string; // "global"
  totalVisits: number;
  lastUpdated: any;
}

export interface DailyVisit {
  id: string; // formatted date (e.g., YYYY-MM-DD)
  count: number;
  lastUpdated: any;
}
