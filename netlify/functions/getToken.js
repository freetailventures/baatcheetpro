import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';
dotenv.config();

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

export const handler = async (event, context) => {
    // Add CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    const { queryStringParameters } = event;
    const room = queryStringParameters.room;
    const identity = queryStringParameters.identity;

    if (!room || !identity) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing room or identity' })
        };
    }

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Missing LiveKit Credentials' })
        };
    }

    try {
        const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity,
            ttl: '6h',
        });

        token.addGrant({
            room,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,
        });

        const jwt = await token.toJwt();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ token: jwt })
        };
    } catch (error) {
        console.error('Error generating token:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Error generating token' })
        };
    }
};
