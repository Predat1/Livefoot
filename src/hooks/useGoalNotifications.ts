import { useEffect, useRef, useCallback, useState } from "react";
import type { LeagueData } from "./useApiFootball";

export interface GoalNotification {
  id: string;
  time: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  matchId: string;
}

function playGoalSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, start: number, dur: number, gain = 0.3) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gainNode.gain.setValueAtTime(gain, ctx.currentTime + start);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    };
    playTone(523, 0, 0.15);
    playTone(659, 0.18, 0.15);
    playTone(784, 0.36, 0.15);
    playTone(1047, 0.54, 0.35, 0.4);
  } catch {}
}

async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function sendBrowserNotification(goal: GoalNotification) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(`⚽ GOAL! ${goal.homeTeam} ${goal.homeScore} - ${goal.awayScore} ${goal.awayTeam}`, {
      body: `${goal.minute}' · ${goal.league}`,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: goal.id,
      requireInteraction: false,
    });
  } catch {}
}

export function useGoalNotifications(liveLeagues: LeagueData[] | undefined, soundEnabled: boolean) {
  const prevGoalsRef = useRef<Record<string, number>>({});
  const [goalHistory, setGoalHistory] = useState<GoalNotification[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted"
  );
  const initializedRef = useRef(false);

  const liveMatches = liveLeagues || [];

  // Initialize previous scores on first data load
  useEffect(() => {
    if (initializedRef.current || liveMatches.length === 0) return;
    initializedRef.current = true;
    const initial: GoalNotification[] = [];
    liveMatches.forEach((league) => {
      league.matches.forEach((match) => {
        const total = (match.homeTeam.score ?? 0) + (match.awayTeam.score ?? 0);
        prevGoalsRef.current[match.id] = total;
        // Seed history with current scores
        if (total > 0) {
          initial.push({
            id: `${match.id}-init`,
            time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            league: league.name,
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name,
            homeScore: match.homeTeam.score ?? 0,
            awayScore: match.awayTeam.score ?? 0,
            minute: match.minute ?? 0,
            matchId: match.id,
          });
        }
      });
    });
    setGoalHistory(initial.slice(0, 30));
  }, [liveMatches]);

  const detectGoals = useCallback(() => {
    if (!initializedRef.current) return;
    liveMatches.forEach((league) => {
      league.matches.forEach((match) => {
        const key = match.id;
        const currentTotal = (match.homeTeam.score ?? 0) + (match.awayTeam.score ?? 0);
        const prev = prevGoalsRef.current[key];
        if (prev !== undefined && currentTotal > prev) {
          if (soundEnabled) playGoalSound();
          const newGoal: GoalNotification = {
            id: `${key}-${Date.now()}`,
            time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            league: league.name,
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name,
            homeScore: match.homeTeam.score ?? 0,
            awayScore: match.awayTeam.score ?? 0,
            minute: match.minute ?? 0,
            matchId: match.id,
          };
          setGoalHistory((prev) => [newGoal, ...prev].slice(0, 50));
          if (notificationsEnabled) sendBrowserNotification(newGoal);
        }
        prevGoalsRef.current[key] = currentTotal;
      });
    });
  }, [liveMatches, soundEnabled, notificationsEnabled]);

  const enableNotifications = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    return granted;
  }, []);

  return { goalHistory, detectGoals, notificationsEnabled, enableNotifications };
}
