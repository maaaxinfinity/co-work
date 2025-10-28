import { db } from '@/db';
import { projectMembers } from '@/db/schema';

async function main() {
    const sampleProjectMembers = [
        {
            projectId: 1,
            userId: 1,
            role: 'owner',
            createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
        },
        {
            projectId: 1,
            userId: 2,
            role: 'editor',
            createdAt: new Date('2024-01-16T14:30:00Z').toISOString(),
        },
        {
            projectId: 1,
            userId: 3,
            role: 'viewer',
            createdAt: new Date('2024-01-17T09:15:00Z').toISOString(),
        }
    ];

    await db.insert(projectMembers).values(sampleProjectMembers);
    
    console.log('✅ Project members seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});