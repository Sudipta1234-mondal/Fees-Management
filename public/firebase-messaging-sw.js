// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// NOTE: Replace this with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAni6H26MgOy8AqhToi0UnPd3CqzVjYxjU",
    authDomain: "balance-sheet-b1db5.firebaseapp.com",
    projectId: "balance-sheet-b1db5",
    storageBucket: "balance-sheet-b1db5.firebasestorage.app",
    messagingSenderId: "841684696266",
    appId: "1:841684696266:web:3c53378d9aa8f35f748833"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon-192.png',
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
