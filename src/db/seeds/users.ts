import { randomBytes, pbkdf2Sync } from 'crypto';
import { db } from '@/db';
import { users } from '@/db/schema';
import { REGIONS, REGION_SLUG, ROLE_LABELS, USER_ROLES } from '@/lib/constants/access-control';

function hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derived = pbkdf2Sync(password, salt, 120_000, 64, 'sha512').toString('hex');
    return `${salt}:${derived}`;
}

async function main() {
    const baseTime = new Date('2024-01-01T08:00:00Z').getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    let index = 0;

    const sampleUsers = [] as Array<Record<string, unknown>>;

    // 单独预置一位超级管理员
    sampleUsers.push({
        name: '超级管理员',
        role: 'admin',
        region: REGIONS[0],
        email: 'admin@example.com',
        passwordHash: hashPassword('Admin#2024'),
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin-master',
        createdAt: new Date(baseTime).toISOString(),
        updatedAt: new Date(baseTime + dayMs).toISOString(),
        lastLoginAt: new Date(baseTime + dayMs * 2).toISOString(),
    });

    const perRegionRoles = USER_ROLES.filter((role) => role !== 'admin');

    REGIONS.forEach((region) => {
        const slug = REGION_SLUG[region];
        perRegionRoles.forEach((role) => {
            const createdAt = new Date(baseTime + index * dayMs).toISOString();
            const updatedAt = new Date(baseTime + (index + 10) * dayMs).toISOString();
            const lastLoginAt = new Date(baseTime + (index + 20) * dayMs).toISOString();
            index += 1;

            sampleUsers.push({
                name: `${region}-${ROLE_LABELS[role]}`,
                role,
                region,
                email: `${role}-${slug}@example.com`,
                passwordHash: hashPassword(role === 'operator' ? 'Operator#2024' : 'User#2024'),
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${role}-${slug}`,
                createdAt,
                updatedAt,
                lastLoginAt,
            });
        });
    });

    await db.insert(users).values(sampleUsers);
    
    console.warn('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
