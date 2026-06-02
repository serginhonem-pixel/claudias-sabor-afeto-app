importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// Config preenchida pelo Next.js via next.config.mjs (NEXT_PUBLIC vars)
// Como service workers não leem env vars, usamos o meta tag injetado ou config hardcoded
firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY || "",
  authDomain: self.FIREBASE_AUTH_DOMAIN || "claudiasaboreafeto-800f8.firebaseapp.com",
  projectId: self.FIREBASE_PROJECT_ID || "claudiasaboreafeto-800f8",
  storageBucket: self.FIREBASE_STORAGE_BUCKET || "claudiasaboreafeto-800f8.appspot.com",
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || "",
  appId: self.FIREBASE_APP_ID || "",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "Claudia's Sabor e Afeto", {
    body: body || "Novo pedido recebido!",
    icon: "/logo.png",
    badge: "/logo.png",
    data: payload.data,
    actions: [{ action: "open", title: "Ver pedidos" }],
  });
});

self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow("/pedidos"));
});
