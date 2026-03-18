importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCXAoP8JC5JZxNBkvtzCg4tBzUGuYTgCoU",
  authDomain: "orgo-e6ff8.firebaseapp.com",
  projectId: "orgo-e6ff8",
  storageBucket: "orgo-e6ff8.firebasestorage.app",
  messagingSenderId: "787837715214",
  appId: "1:787837715214:web:387108dbaccbd48cea4d5f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
