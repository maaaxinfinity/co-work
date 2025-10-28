import { db } from '@/db';
import { tasks } from '@/db/schema';

async function main() {
    const sampleTasks = [
        {
            fileId: 3,
            title: '完善用户认证模块的需求描述',
            status: 'completed',
            createdAt: new Date('2024-01-15T09:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-15T16:30:00Z').toISOString(),
        },
        {
            fileId: 3,
            title: '添加文件上传功能的详细说明',
            status: 'in_progress',
            createdAt: new Date('2024-01-16T10:15:00Z').toISOString(),
            updatedAt: new Date('2024-01-17T14:20:00Z').toISOString(),
        },
        {
            fileId: 4,
            title: '更新数据库ER图',
            status: 'pending',
            createdAt: new Date('2024-01-17T08:30:00Z').toISOString(),
            updatedAt: new Date('2024-01-17T08:30:00Z').toISOString(),
        },
        {
            fileId: 4,
            title: '补充API接口文档',
            status: 'in_progress',
            createdAt: new Date('2024-01-17T11:45:00Z').toISOString(),
            updatedAt: new Date('2024-01-18T09:15:00Z').toISOString(),
        },
        {
            fileId: 3,
            title: '评审产品需求优先级',
            status: 'pending',
            createdAt: new Date('2024-01-18T13:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-18T13:00:00Z').toISOString(),
        },
    ];

    await db.insert(tasks).values(sampleTasks);
    
    console.warn('✅ Tasks seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
