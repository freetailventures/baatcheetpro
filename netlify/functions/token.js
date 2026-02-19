import jwt from 'jsonwebtoken';

// Netlify Functions + ESM environment
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
        const now = Math.floor(Date.now() / 1000);

        const payload = {
            iss: LIVEKIT_API_KEY,
            sub: identity,
            nbf: now,
            exp: now + 6 * 60 * 60, // 6 hours
            video: {
                room: room,
                roomJoin: true,
                canPublish: true,
                canSubscribe: true,
                canPublishData: true,
            }
        };

        // Using jsonwebtoken directly — generates standard {"alg":"HS256","typ":"JWT"} header
        // which is required by LiveKit server's go-jose JWT verification
        const token = jwt.sign(payload, LIVEKIT_API_SECRET, {
            algorithm: 'HS256',
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ token }),
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
