"use client";
import { useEffect } from "react";
import { getMessaging, getToken } from "firebase/messaging";
import app from "@/lib/firebase";
import { updateConta } from "@/lib/firestore";

export function useFCM(contaId: string | undefined) {
  useEffect(() => {
    if (!contaId || !app || typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission === "denied") return;

    async function register() {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
        const messaging = getMessaging(app!);
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: swReg,
        });

        if (token) {
          await updateConta(contaId!, { fcmToken: token } as never);
        }
      } catch (e) {
        console.error("FCM registro:", e);
      }
    }

    register();
  }, [contaId]);
}
