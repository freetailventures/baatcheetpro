import { database, ref, get, update } from '../src/firebase.js';

async function fixDatabase() {
    console.log('🔧 Starting database cleanup...');
    const roomsRef = ref(database, 'rooms');

    try {
        const snapshot = await get(roomsRef);
        if (!snapshot.exists()) {
            console.log('✅ No rooms found. Database is clean.');
            process.exit(0);
        }

        const rooms = snapshot.val();
        const updates = {};
        let fixCount = 0;

        Object.keys(rooms).forEach(key => {
            const room = rooms[key];

            // Check for corrupted participants count
            if (typeof room.participants !== 'number') {
                console.log(`⚠️  Fixing room "${room.name}" (${key}): participants was ${JSON.stringify(room.participants)}`);
                updates[`/rooms/${key}/participants`] = 0;
                fixCount++;
            }
        });

        if (fixCount > 0) {
            await update(ref(database), updates);
            console.log(`✅ Successfully fixed ${fixCount} rooms.`);
        } else {
            console.log('✅ All rooms have valid data. No fixes needed.');
        }

    } catch (error) {
        console.error('❌ Error fixing database:', error);
    }

    process.exit(0);
}

fixDatabase();
