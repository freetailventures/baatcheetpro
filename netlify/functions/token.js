import { AccessToken } from 'livekit-server-sdk';
import 'dotenv/config'; // Necessary if testing locally; Netlify injects these automatically in prod

exports.handler = async (event, context) => {
    // Only allow GET requests (or POST if you prefer, but your frontend uses GET params currently maybe?)
    // Actually, let's keep it consistent with your express server which used GET
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { room, identity } = event.queryStringParameters;

    if (!room || !identity) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing required parameters: room and identity' }),
        };
    }

    const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
    const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server misconfigured: Missing API keys' }),
        };
    }

    try {
        const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: identity,
            ttl: '6h',
        });

        token.addGrant({
            room: room,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });

        const jwt = await token.toJwt();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // CORS for public access
            },
            body: JSON.stringify({ token: jwt }),
        };
    } catch (error) {
        console.error('Error generating token:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate token' }),
        };
    }
};
