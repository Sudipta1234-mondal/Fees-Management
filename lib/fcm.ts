import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';

// NOTE: Replace this with your actual VAPID key from the Firebase Console
// Project Settings > Cloud Messaging > Web configuration > Web Push certificates
export const VAPID_KEY = 'YOUR_ACTUAL_VAPID_KEY_HERE';

export const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log('This browser does not support notifications.');
        return null;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const messaging = getMessaging(app);
            const token = await getToken(messaging, {
                vapidKey: VAPID_KEY,
            });
            return token;
        } else {
            console.log('Notification permission denied.');
            return null;
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        const messaging = getMessaging(app);
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
