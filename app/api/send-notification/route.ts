import { NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

async function getAccessToken() {
    const auth = new GoogleAuth({
        credentials: {
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/firebase.messaging']
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return token.token;
}

export async function POST(request: Request) {
    try {
        const { token, title, body } = await request.json();

        if (!token || !title || !body) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const accessToken = await getAccessToken();

        const fcmResponse = await fetch('https://fcm.googleapis.com/v1/projects/balance-sheet-b1db5/messages:send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                message: {
                    token: token,
                    notification: {
                        title: title,
                        body: body
                    }
                }
            })
        });

        if (!fcmResponse.ok) {
            const errorText = await fcmResponse.text();
            console.error('FCM v1 send failed:', errorText);

            let isUnregistered = false;
            try {
                const parsed = JSON.parse(errorText);
                if (parsed.error?.details?.some((d: any) => d.errorCode === 'UNREGISTERED')) {
                    isUnregistered = true;
                }
            } catch (e) {
                if (errorText.includes('UNREGISTERED')) isUnregistered = true;
            }

            return NextResponse.json({ 
                error: 'FCM send failed', 
                details: errorText,
                isUnregistered
            }, { status: 400 });
        }

        const data = await fcmResponse.json();
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Error in side send-notification API:', error);
        return NextResponse.json({ error: 'Failed to send notification API', details: error.message }, { status: 500 });
    }
}
