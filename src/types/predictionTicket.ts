// ─── Prediction Ticket Types ────────────────────────────────────────────────

export interface PredictionTicketItem {
  id: string;
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  leagueName?: string;
  matchDate?: string;
  predictionKey: string;
  predictionLabel: string;
  predictionValue: string | number;
  confidence?: number;
  probability?: number;
  risk?: "low" | "medium" | "high";
  odd?: number;
  source?: "ai" | "api" | "local" | "user";
  createdAt: string;
}

export interface PredictionTicket {
  id: string;
  userId?: string;
  title?: string;
  items: PredictionTicketItem[];
  status: "draft" | "saved" | "shared";
  createdAt: string;
  updatedAt: string;
  publicShareId?: string;
}

export interface TicketSummary {
  count: number;
  avgConfidence: number;
  globalRisk: "low" | "medium" | "high";
  matchCount: number;
  categories: string[];
}
