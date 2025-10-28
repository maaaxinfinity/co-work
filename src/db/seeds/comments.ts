import { db } from '@/db';
import { comments } from '@/db/schema';

async function main() {
    // Insert top-level comments first and get their IDs
    const topLevelComments = [
        {
            fileId: 3,
            parentCommentId: null,
            author: '张三',
            content: '这个需求描述得很清楚，我们可以开始开发了',
            resolved: false,
            createdAt: new Date('2024-01-15T10:30:00').toISOString(),
        },
        {
            fileId: 3,
            parentCommentId: null,
            author: '王五',
            content: '文件上传功能的存储方案需要再讨论一下',
            resolved: false,
            createdAt: new Date('2024-01-15T11:15:00').toISOString(),
        },
    ];

    const insertedTopLevel = await db.insert(comments).values(topLevelComments).returning();

    // Insert reply comments using the returned parent IDs
    const replyComments = [
        {
            fileId: 3,
            parentCommentId: insertedTopLevel[0].id,
            author: '李四',
            content: '同意，我负责后端API部分',
            resolved: false,
            createdAt: new Date('2024-01-15T14:20:00').toISOString(),
        },
        {
            fileId: 3,
            parentCommentId: insertedTopLevel[1].id,
            author: '张三',
            content: '好的，已经更新了存储方案，使用云存储服务',
            resolved: true,
            createdAt: new Date('2024-01-15T16:45:00').toISOString(),
        },
    ];

    await db.insert(comments).values(replyComments);

    console.log('✅ Comments seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});