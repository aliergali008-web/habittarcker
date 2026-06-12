import type { AppData } from "../types";
import { daysAgo, prettyDate, today } from "./dates";
import { focusScore } from "./score";
import { goldenWindow, hourBuckets } from "./stats";

/**
 * "Study Wrapped" — paints a shareable recap of the last 7 days onto a
 * canvas and opens the share sheet (or downloads the image).
 */
export async function shareWrapped(data: AppData, name?: string) {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  await document.fonts.load('700 130px "Baloo 2"').catch(() => {});
  const display = (size: number) => `700 ${size}px "Baloo 2", "Nunito", sans-serif`;
  const body = (size: number, weight = 700) =>
    `${weight} ${size}px "Nunito", sans-serif`;

  // last-7-days numbers
  const week = new Set(Array.from({ length: 7 }, (_, i) => daysAgo(i)));
  const sessions = data.sessions.filter((s) => week.has(s.date));
  const minutes = sessions.reduce((a, s) => a + s.minutes, 0);
  const hours = `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  const golden = goldenWindow(hourBuckets(sessions));
  const bySubject = new Map<string, number>();
  for (const s of sessions)
    if (s.subject)
      bySubject.set(
        s.subject.toLowerCase(),
        (bySubject.get(s.subject.toLowerCase()) ?? 0) + s.minutes
      );
  const top = [...bySubject.entries()].sort((a, b) => b[1] - a[1])[0];
  const score = focusScore(data);

  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  };

  // backdrop
  const bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
  bg.addColorStop(0, "#cdbcf6");
  bg.addColorStop(0.55, "#e9d6e3");
  bg.addColorStop(1, "#f6d3ad");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // floating blobs
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(950, 130, 150, 0, 7);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(90, 1150, 190, 0, 7);
  ctx.fill();
  ctx.globalAlpha = 1;

  // card
  ctx.save();
  rr(64, 110, W - 128, 1170, 56);
  ctx.shadowColor = "rgba(40,30,20,0.25)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  ctx.fillStyle = "#fffcf6";
  ctx.fill();
  ctx.restore();

  const cx = 64 + 64;
  ctx.fillStyle = "#c25415";
  ctx.font = body(34, 800);
  ctx.fillText("STUDY WRAPPED", cx, 230);

  ctx.fillStyle = "#241f19";
  ctx.font = display(72);
  ctx.fillText(`${name?.trim() || "My"}${name?.trim() ? "'s" : ""} week`, cx, 320);

  ctx.fillStyle = "#93887a";
  ctx.font = body(32, 600);
  ctx.fillText(`${prettyDate(daysAgo(6))} — ${prettyDate(today())}`, cx, 372);

  // hero number
  ctx.fillStyle = "#241f19";
  ctx.font = display(150);
  ctx.fillText(hours, cx, 540);
  ctx.fillStyle = "#93887a";
  ctx.font = body(34, 600);
  ctx.fillText("of deep, focused work", cx, 592);

  // squiggle
  ctx.strokeStyle = "#e9712d";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  let sx = cx;
  ctx.moveTo(sx, 646);
  for (let i = 0; i < 5; i++) {
    ctx.quadraticCurveTo(sx + 22, 630, sx + 44, 646);
    ctx.quadraticCurveTo(sx + 66, 662, sx + 88, 646);
    sx += 88;
  }
  ctx.stroke();

  // stat rows
  const rows: [string, string][] = [
    ["Sessions", String(sessions.length)],
    ["Golden hour", golden ? `${golden.label}` : "still mapping"],
    ["Top subject", top ? top[0] : "—"],
  ];
  let y = 720;
  for (const [label, value] of rows) {
    rr(cx, y, W - 256, 104, 32);
    ctx.fillStyle = ["#fbe3c8", "#e6defc", "#ddeed6"][rows.findIndex((r) => r[0] === label) % 3];
    ctx.fill();
    ctx.fillStyle = "rgba(36,31,25,0.55)";
    ctx.font = body(30, 700);
    ctx.fillText(label.toUpperCase(), cx + 36, y + 64);
    ctx.fillStyle = "#241f19";
    ctx.font = display(44);
    const w = ctx.measureText(value).width;
    ctx.fillText(value, cx + (W - 256) - 36 - w, y + 68);
    y += 124;
  }

  // focus score bar
  rr(cx, y + 8, W - 256, 132, 40);
  ctx.fillStyle = "#29231e";
  ctx.fill();
  ctx.fillStyle = "rgba(247,241,231,0.6)";
  ctx.font = body(30, 700);
  ctx.fillText("FOCUS SCORE", cx + 40, y + 86);
  ctx.fillStyle = "#f0a26d";
  ctx.font = display(64);
  const sc = score ? String(score.score) : "—";
  ctx.fillText(sc, cx + (W - 256) - 40 - ctx.measureText(sc).width, y + 96);

  // footer, on the gradient below the card
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = body(28, 800);
  const foot = "tracked with StudyTracker";
  ctx.fillText(foot, (W - ctx.measureText(foot).width) / 2, H - 28);

  const blob: Blob | null = await new Promise((res) =>
    canvas.toBlob(res, "image/png")
  );
  if (!blob) return;
  const file = new File([blob], `study-wrapped-${today()}.png`, {
    type: "image/png",
  });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] }).catch(() => {});
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}
