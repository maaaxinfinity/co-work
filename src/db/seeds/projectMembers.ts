import { db } from '@/db';
import { projectMembers, users } from '@/db/schema';
import { REGION_SLUG } from '@/lib/constants/access-control';
import { eq } from 'drizzle-orm';

async function main() {
    const targetEmails = [
        { email: 'admin@example.com', role: 'admin' },
        { email: `operator-${REGION_SLUG['北京']}@example.com`, role: 'operator' },
        { email: `user-${REGION_SLUG['北京']}@example.com`, role: 'user' },
    ];

    const sampleProjectMembers = [] as Array<{ projectId: number; userId: number; role: string; createdAt: string }>;

    for (const target of targetEmails) {
        const found = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, target.email))
            .limit(1);

        if (found.length === 0) {
            console.warn(`⚠️  未找到用户 ${target.email}，跳过 projectMembers seeding`);
            continue;
        }

        sampleProjectMembers.push({
            projectId: 1,
            userId: found[0].id,
            role: target.role,
            createdAt: new Date('2024-01-10T10:00:00Z').toISOString(),
        });
    }

    if (sampleProjectMembers.length > 0) {
        await db.insert(projectMembers).values(sampleProjectMembers);
    }
    
    console.warn('✅ Project members seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
