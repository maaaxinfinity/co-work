import { db } from '@/db';
import { messageContextFiles } from '@/db/schema';

async function main() {
    const sampleMessageContextFiles = [
        {
            messageId: 2,
            fileId: 3,
            createdAt: new Date('2024-01-15T10:30:00Z').toISOString(),
        },
        {
            messageId: 6,
            fileId: 4,
            createdAt: new Date('2024-01-16T14:20:00Z').toISOString(),
        },
    ];

    await db.insert(messageContextFiles).values(sampleMessageContextFiles);
    
    console.warn('✅ Message context files seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
