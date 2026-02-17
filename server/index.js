// ============================================
// Token Server for LiveKit
// ============================================
// This tiny server does ONE thing:
// It creates LiveKit tokens so browser users can join voice rooms.
//
// Why do we need this?
// The LiveKit API Secret must stay hidden on the server.
// If we put it in the browser code, anyone could see it!

import express from 'express';
import cors from 'cors';
import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';

// Load environment variables from .env file
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Allow requests from our front-end (CORS)
app.use(cors());

// LiveKit API credentials (from your self-hosted LiveKit server)
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

// Check that credentials are set
if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    console.error('❌ ERROR: LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set in .env file!');
    console.error('   Get these from your LiveKit server config (livekit.yaml) on your VPS.');
    process.exit(1);
}

/**
 * GET /getToken
 * 
 * Query parameters:
 *   room     - The name of the room to join
 *   identity - The user's display name
 * 
 * Returns:
 *   { token: "eyJhbGciOi..." }
 */
app.get('/getToken', async (req, res) => {
    const { room, identity } = req.query;

    // Validate inputs
    if (!room || !identity) {
        return res.status(400).json({
            error: 'Missing required parameters: room and identity'
        });
    }

    try {
        // Create a new access token
        const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
            identity: identity,
            ttl: '6h', // Token expires in 6 hours
        });

        // Grant permission to join the specified room
        token.addGrant({
            room: room,
            roomJoin: true,
            canPublish: true,       // Can publish audio
            canSubscribe: true,     // Can hear others
            canPublishData: true,   // Can send data messages
        });

        // Generate the JWT token string
        const jwt = await token.toJwt();

        res.json({ token: jwt });

        console.log(`✅ Token generated for "${identity}" → room "${room}"`);
    } catch (error) {
        console.error('❌ Error generating token:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'ybk-token-server' });
});

// Start the server
app.listen(PORT, () => {
    console.log('');
    console.log('🎙️  Yaha Baat Karo — Token Server');
    console.log(`✅  Running on http://localhost:${PORT}`);
    console.log(`🔑  API Key: ${LIVEKIT_API_KEY.substring(0, 8)}...`);
    console.log('');
    console.log('Endpoints:');
    console.log(`  GET /getToken?room=ROOM_NAME&identity=USER_NAME`);
    console.log(`  GET /health`);
    console.log('');
});
