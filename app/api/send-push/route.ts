import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize firebase-admin if not already initialized
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                // Ensure private key handles newlines correctly from env variables
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } catch (error) {
        console.error('Firebase admin initialization error', error);
    }
}

export async function POST(request: Request) {
    try {
        const { token, title, body } = await request.json();

        if (!token || !title || !body) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const message = {
            notification: {
                title,
                body,
            },
            token,
            webpush: {
                notification: {
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    click_action: '/', // URL to open when clicked
                },
            },
        };

        const response = await admin.messaging().send(message);
        console.log('Successfully sent push notification:', response);

        return NextResponse.json({ success: true, response });
    } catch (error) {
        console.error('Error sending push notification:', error);
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
    }
}
