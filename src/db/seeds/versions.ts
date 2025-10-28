import { db } from '@/db';
import { versions } from '@/db/schema';

async function main() {
    const sampleVersions = [
        {
            fileId: 3,
            title: '初始版本',
            author: '张三',
            content: '# 产品需求文档\n\n## 基础功能\n- 文件管理',
            createdAt: new Date('2024-01-15T10:00:00').toISOString(),
        },
        {
            fileId: 3,
            title: '添加协作功能',
            author: '李四',
            content: '# 产品需求文档\n\n## 核心功能\n- 文件管理\n- 实时协作',
            createdAt: new Date('2024-01-15T11:00:00').toISOString(),
        },
        {
            fileId: 3,
            title: '完整需求文档',
            author: '张三',
            content: '# 产品需求文档\n\n## 核心功能\n- 文件管理\n- 实时协作\n- 版本控制',
            createdAt: new Date('2024-01-15T12:00:00').toISOString(),
        },
    ];

    await db.insert(versions).values(sampleVersions);
    
    console.warn('✅ Versions seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});
