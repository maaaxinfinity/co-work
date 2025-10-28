import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            name: '张三',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
            createdAt: new Date('2024-01-15T08:00:00Z').toISOString(),
        },
        {
            name: '李四',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
            createdAt: new Date('2024-01-20T09:30:00Z').toISOString(),
        },
        {
            name: '王五',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu',
            createdAt: new Date('2024-02-01T10:15:00Z').toISOString(),
        },
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});