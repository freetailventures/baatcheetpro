import { AccessToken } from 'livekit-server-sdk';

// Netlify Functions + Vite/ESM environment
export const handler = async (event, context) => {
    // CORS Headers (Required for fetch from frontend)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    // Handle OPTIONS request (Preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow GET
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: 'Method Not Allowed'
        };
    }

    const { room, identity } = event.queryStringParameters;

    if (!room || !identity) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing required parameters: room and identity' }),
        };
    }

    const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
    const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
        console.error('SERVER ERROR: Missing API Keys');
        return {
            statusCode: 500,
            headers,
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
            headers,
            body: JSON.stringify({ token: jwt }),
        };
    } catch (error) {
        console.error('Error generating token:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to generate token', details: error.message }),
        };
    }
};
