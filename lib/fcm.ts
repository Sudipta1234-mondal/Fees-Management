import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from './firebase';

// Web Push Certificate (VAPID Key) from Firebase Console
export const VAPID_KEY = 'BCj6WXDGlx1xzwsPW9aINo90VEgh2LMdazkGsMeml5ZQPvkUqmpHcgbVASQ6k4lbf5W9zKqEGWHeiUBZC15PZKM';

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
