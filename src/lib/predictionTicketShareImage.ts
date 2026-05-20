import type { PredictionTicket, PredictionTicketItem } from "@/types/predictionTicket";

const SITE_URL = "https://www.livefoot.fun";
const BRAND_COLOR_BG = "#0c1628";
const BRAND_COLOR_GREEN = "#22c55e";
const BRAND_COLOR_GOLD = "#f59e0b";
const BRAND_WHITE = "#ffffff";

function riskColor(risk?: string): string {
  if (risk === "low") return "#22c55e";
  if (risk === "medium") return "#f59e0b";
  if (risk === "high") return "#ef4444";
  return "#94a3b8";
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, currentY);
  return currentY;
}

/**
 * Génère une image PNG du ticket de prédictions via Canvas HTML5.
 */
export async function generatePredictionTicketImage(ticket: PredictionTicket): Promise<Blob> {
  const CARD_W = 720;
  const HEADER_H = 110;
  const ITEM_H = 68;
  const FOOTER_H = 80;
  const MAX_ITEMS = 5;
  const displayItems = ticket.items.slice(0, MAX_ITEMS);
  const CARD_H = HEADER_H + displayItems.length * ITEM_H + FOOTER_H + 24;

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;

  // ─── Background gradient ──────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CARD_H);
  bgGrad.addColorStop(0, "#0c1a2e");
  bgGrad.addColorStop(1, "#060d1a");
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.roundRect(0, 0, CARD_W, CARD_H, 20);
  ctx.fill();

  // ─── Header green accent bar ──────────────────────────────────────────────
  const accentGrad = ctx.createLinearGradient(0, 0, CARD_W, 0);
  accentGrad.addColorStop(0, "#22c55e");
  accentGrad.addColorStop(1, "#16a34a");
  ctx.fillStyle = accentGrad;
  ctx.fillRect(0, 0, CARD_W, 4);

  // ─── Header: brand + title ───────────────────────────────────────────────
  ctx.fillStyle = BRAND_COLOR_GREEN;
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.fillText("⚽ LiveFoot", 28, 48);

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillText(SITE_URL, 28, 68);

  // Title right
  ctx.fillStyle = BRAND_WHITE;
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Mon Ticket de Prédictions", CARD_W - 28, 48);

  const summary = computeSummary(ticket.items);
  ctx.fillStyle = riskColor(summary.globalRisk);
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillText(`Confiance moy. ${summary.avgConfidence}%`, CARD_W - 28, 68);
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText(`${summary.count} sélection${summary.count > 1 ? "s" : ""} • ${summary.matchCount} match${summary.matchCount > 1 ? "s" : ""}`, CARD_W - 28, 88);

  // Divider
  ctx.textAlign = "left";
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, HEADER_H - 8);
  ctx.lineTo(CARD_W - 24, HEADER_H - 8);
  ctx.stroke();

  // ─── Items ────────────────────────────────────────────────────────────────
  displayItems.forEach((item, idx) => {
    const y = HEADER_H + idx * ITEM_H;

    // Row bg alternation
    if (idx % 2 === 0) {
      ctx.fillStyle = "rgba(255,255,255,0.025)";
      ctx.fillRect(16, y + 4, CARD_W - 32, ITEM_H - 8);
    }

    // Team names
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "11px system-ui, sans-serif";
    const matchLabel = `${item.homeTeam} vs ${item.awayTeam}`;
    ctx.fillText(matchLabel, 28, y + 22);

    // Prediction label
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "10px system-ui, sans-serif";
    ctx.fillText(item.predictionLabel, 28, y + 38);

    // Prediction value (main)
    ctx.fillStyle = BRAND_WHITE;
    ctx.font = "bold 14px system-ui, sans-serif";
    const valStr = String(item.predictionValue);
    ctx.fillText(valStr.length > 26 ? valStr.slice(0, 25) + "…" : valStr, 28, y + 55);

    // Confidence badge (right)
    const confText = `${item.confidence ?? 50}%`;
    ctx.fillStyle = riskColor(item.risk);
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(confText, CARD_W - 28, y + 38);

    // Risk label
    ctx.fillStyle = riskColor(item.risk);
    ctx.font = "10px system-ui, sans-serif";
    const riskLabel = item.risk === "low" ? "Faible risque" : item.risk === "medium" ? "Risque modéré" : "Risque élevé";
    ctx.fillText(riskLabel, CARD_W - 28, y + 55);
    ctx.textAlign = "left";
  });

  if (ticket.items.length > MAX_ITEMS) {
    const y = HEADER_H + MAX_ITEMS * ITEM_H + 12;
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "italic 12px system-ui, sans-serif";
    ctx.fillText(`+ ${ticket.items.length - MAX_ITEMS} autre(s) sélection(s)`, 28, y);
  }

  // ─── Footer ───────────────────────────────────────────────────────────────
  const footerY = HEADER_H + displayItems.length * ITEM_H + 24;

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(24, footerY);
  ctx.lineTo(CARD_W - 24, footerY);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.font = "11px system-ui, sans-serif";
  ctx.fillText("Ticket de prédictions à titre informatif. Aucune transaction sur LiveFoot.", 28, footerY + 22);

  ctx.fillStyle = BRAND_COLOR_GREEN;
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.fillText(SITE_URL, 28, footerY + 44);

  if (ticket.publicShareId) {
    const shareUrl = `${SITE_URL}/ticket/${ticket.publicShareId}`;
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(shareUrl, CARD_W - 28, footerY + 44);
    ctx.textAlign = "left";
  }

  return new Promise(resolve => canvas.toBlob(blob => resolve(blob!), "image/png", 0.95));
}

/**
 * Télécharge l'image du ticket en PNG.
 */
export async function downloadPredictionTicketImage(ticket: PredictionTicket): Promise<void> {
  const blob = await generatePredictionTicketImage(ticket);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ticket-livefoot-${ticket.publicShareId || "draft"}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Partage l'image du ticket via Web Share API (fichier) ou téléchargement fallback.
 */
export async function sharePredictionTicketImage(ticket: PredictionTicket): Promise<void> {
  const blob = await generatePredictionTicketImage(ticket);
  const file = new File([blob], `ticket-livefoot.png`, { type: "image/png" });
  const shareUrl = ticket.publicShareId ? `${SITE_URL}/ticket/${ticket.publicShareId}` : SITE_URL;
  const summary = computeSummary(ticket.items);
  const text = `Mon ticket LiveFoot : ${summary.count} prédictions, confiance ${summary.avgConfidence}%. Consulte-le ici : ${shareUrl}`;

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ title: "Mon ticket LiveFoot", text, files: [file], url: shareUrl });
      return;
    } catch { /* user cancelled or not supported */ }
  }
  // Fallback: download + copy link
  await downloadPredictionTicketImage(ticket);
  try {
    await navigator.clipboard.writeText(shareUrl);
  } catch { /* ignore */ }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function computeSummary(items: PredictionTicketItem[]) {
  const count = items.length;
  if (count === 0) return { count: 0, avgConfidence: 0, globalRisk: "low" as const, matchCount: 0 };
  const avg = Math.round(items.reduce((s, i) => s + (i.confidence ?? 50), 0) / count);
  const highC = items.filter(i => i.risk === "high").length;
  const medC  = items.filter(i => i.risk === "medium").length;
  const globalRisk: "low" | "medium" | "high" = highC > count * 0.4 ? "high" : highC + medC > count * 0.4 ? "medium" : "low";
  const matchCount = new Set(items.map(i => i.fixtureId)).size;
  return { count, avgConfidence: avg, globalRisk, matchCount };
}
