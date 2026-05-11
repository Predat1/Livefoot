export interface MatchShareImageData {
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status: "scheduled" | "live" | "finished";
  minute?: number | null;
  league?: string;
  dateLabel?: string;
  matchUrl: string;
}

const WIDTH = 1200;
const HEIGHT = 630;

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawFitText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, fontSize: number, weight = 900) {
  let size = fontSize;
  do {
    ctx.font = `${weight} ${size}px Inter, Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  } while (size > 22);
  ctx.fillText(text, x, y);
}

async function loadImage(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawTeamLogo(ctx: CanvasRenderingContext2D, image: HTMLImageElement | null, x: number, y: number, label: string) {
  drawRoundRect(ctx, x, y, 132, 132, 36);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fill();
  ctx.strokeStyle = "rgba(34,197,94,0.35)";
  ctx.lineWidth = 3;
  ctx.stroke();

  if (image) {
    const scale = Math.min(92 / image.width, 92 / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    ctx.drawImage(image, x + 66 - w / 2, y + 66 - h / 2, w, h);
    return;
  }

  ctx.fillStyle = "#0f172a";
  ctx.font = "900 48px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label.slice(0, 2).toUpperCase(), x + 66, y + 66);
}

export async function generateMatchShareImage(data: MatchShareImageData): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non supporté");

  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, "#05120d");
  gradient.addColorStop(0.45, "#0f172a");
  gradient.addColorStop(1, "#02130b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(34,197,94,0.18)";
  ctx.beginPath();
  ctx.arc(1060, 80, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(250,204,21,0.13)";
  ctx.beginPath();
  ctx.arc(80, 560, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  drawRoundRect(ctx, 58, 58, WIDTH - 116, HEIGHT - 116, 44);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#22c55e";
  ctx.font = "900 34px Inter, Arial, sans-serif";
  ctx.fillText("LiveFoot.fun", 92, 115);
  ctx.fillStyle = "rgba(255,255,255,0.68)";
  ctx.font = "700 24px Inter, Arial, sans-serif";
  ctx.fillText(data.league || "Match football", 92, 156);

  const badge = data.status === "live" ? `LIVE${data.minute ? ` • ${data.minute}'` : ""}` : data.status === "finished" ? "TERMINÉ" : data.dateLabel || "À VENIR";
  ctx.textAlign = "right";
  ctx.font = "900 24px Inter, Arial, sans-serif";
  const badgeW = ctx.measureText(badge).width + 44;
  drawRoundRect(ctx, WIDTH - 92 - badgeW, 86, badgeW, 44, 22);
  ctx.fillStyle = data.status === "live" ? "#ef4444" : data.status === "finished" ? "#22c55e" : "#f59e0b";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(badge, WIDTH - 114, 108);

  const [homeLogo, awayLogo] = await Promise.all([loadImage(data.homeLogo), loadImage(data.awayLogo)]);

  drawTeamLogo(ctx, homeLogo, 146, 220, data.homeTeam);
  drawTeamLogo(ctx, awayLogo, 922, 220, data.awayTeam);

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  drawFitText(ctx, data.homeTeam, 212, 410, 310, 36);
  drawFitText(ctx, data.awayTeam, 988, 410, 310, 36);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 92px Inter, Arial, sans-serif";
  const scoreText = data.status === "scheduled" ? "VS" : `${data.homeScore ?? 0} - ${data.awayScore ?? 0}`;
  ctx.fillText(scoreText, WIDTH / 2, 330);

  ctx.fillStyle = "rgba(255,255,255,0.68)";
  ctx.font = "700 26px Inter, Arial, sans-serif";
  ctx.fillText("Scores live • Stats • Pronos IA", WIDTH / 2, 382);

  ctx.textAlign = "center";
  drawRoundRect(ctx, 214, 486, 772, 58, 29);
  ctx.fillStyle = "rgba(15,23,42,0.8)";
  ctx.fill();
  ctx.strokeStyle = "rgba(34,197,94,0.3)";
  ctx.stroke();
  ctx.fillStyle = "#d1fae5";
  ctx.font = "800 25px Inter, Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText(data.matchUrl, WIDTH / 2, 515);

  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.font = "700 18px Inter, Arial, sans-serif";
  ctx.fillText("Partage ce match avec tes amis", WIDTH / 2, 577);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Image non générée"))), "image/png", 0.95);
  });

  return new File([blob], `livefoot-${data.homeTeam}-vs-${data.awayTeam}.png`.replace(/[^a-z0-9.-]+/gi, "-"), {
    type: "image/png",
  });
}

export async function downloadMatchShareImage(data: MatchShareImageData) {
  const file = await generateMatchShareImage(data);
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
