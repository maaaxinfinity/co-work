import { db } from '@/db';
import { messages } from '@/db/schema';

async function main() {
    const sampleMessages = [
        {
            projectId: 1,
            role: 'user',
            content: '帮我生成一个用户注册API的代码',
            quotedMessageId: null,
            pinned: false,
            createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
        },
        {
            projectId: 1,
            role: 'assistant',
            content: '好的，我来帮你生成用户注册API的代码。以下是完整的实现：\n\n\nexport async function POST(request: NextRequest) {\n  const { email, password } = await request.json();\n  // Registration logic\n}\n',
            quotedMessageId: null,
            pinned: false,
            createdAt: new Date('2024-01-15T10:00:30Z').toISOString(),
        },
        {
            projectId: 1,
            role: 'user',
            content: '能不能添加邮箱验证？',
            quotedMessageId: 2,
            pinned: false,
            createdAt: new Date('2024-01-15T10:01:00Z').toISOString(),
        },
        {
            projectId: 1,
            role: 'assistant',
            content: '当然可以！我会添加邮箱格式验证和唯一性检查。',
            quotedMessageId: null,
            pinned: false,
            createdAt: new Date('2024-01-15T10:01:30Z').toISOString(),
        },
        {
            projectId: 1,
            role: 'user',
            content: '数据库表结构设计文档在哪里？',
            quotedMessageId: null,
            pinned: true,
            createdAt: new Date('2024-01-15T10:02:00Z').toISOString(),
        },
        {
            projectId: 1,
            role: 'assistant',
            content: '数据库设计文档在「团队文档」文件夹下的「技术架构.md」文件中。',
            quotedMessageId: null,
            pinned: false,
            createdAt: new Date('2024-01-15T10:02:30Z').toISOString(),
        }
    ];

    await db.insert(messages).values(sampleMessages);
    
    console.log('✅ Messages seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});