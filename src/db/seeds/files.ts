import { db } from '@/db';
import { files } from '@/db/schema';

async function main() {
    // Insert parent folders first and get their IDs
    const teamFolders = await db.insert(files).values([
        {
            projectId: 1,
            parentId: null,
            name: '团队文档',
            type: 'folder',
            fileType: null,
            content: null,
            ownerType: 'team',
            ownerId: null,
            status: 'synced',
            modifiedAt: new Date('2024-01-10T08:00:00Z').toISOString(),
            createdAt: new Date('2024-01-10T08:00:00Z').toISOString(),
        },
        {
            projectId: 1,
            parentId: null,
            name: '设计稿',
            type: 'folder',
            fileType: null,
            content: null,
            ownerType: 'team',
            ownerId: null,
            status: 'synced',
            modifiedAt: new Date('2024-01-10T09:00:00Z').toISOString(),
            createdAt: new Date('2024-01-10T09:00:00Z').toISOString(),
        },
    ]).returning();

    const privateFolders = await db.insert(files).values([
        {
            projectId: 1,
            parentId: null,
            name: '我的笔记',
            type: 'folder',
            fileType: null,
            content: null,
            ownerType: 'private',
            ownerId: 1,
            status: 'new',
            modifiedAt: new Date('2024-01-12T10:00:00Z').toISOString(),
            createdAt: new Date('2024-01-12T10:00:00Z').toISOString(),
        },
        {
            projectId: 1,
            parentId: null,
            name: '代码片段',
            type: 'folder',
            fileType: null,
            content: null,
            ownerType: 'private',
            ownerId: 2,
            status: 'synced',
            modifiedAt: new Date('2024-01-11T14:00:00Z').toISOString(),
            createdAt: new Date('2024-01-11T14:00:00Z').toISOString(),
        },
    ]).returning();

    // Insert team files with correct parentId references
    await db.insert(files).values([
        {
            projectId: 1,
            parentId: teamFolders[0].id,
            name: '产品需求文档.md',
            type: 'file',
            fileType: 'md',
            content: '# 产品需求文档\n\n## 核心功能\n- 文件管理\n- 实时协作\n- 版本控制',
            ownerType: 'team',
            ownerId: null,
            status: 'synced',
            modifiedAt: new Date('2024-01-10T10:30:00Z').toISOString(),
            createdAt: new Date('2024-01-10T10:30:00Z').toISOString(),
        },
        {
            projectId: 1,
            parentId: teamFolders[0].id,
            name: '技术架构.md',
            type: 'file',
            fileType: 'md',
            content: '# 技术架构\n\n## 技术栈\n- Next.js\n- Drizzle ORM\n- PostgreSQL',
            ownerType: 'team',
            ownerId: null,
            status: 'synced',
            modifiedAt: new Date('2024-01-10T11:00:00Z').toISOString(),
            createdAt: new Date('2024-01-10T11:00:00Z').toISOString(),
        },
        {
            projectId: 1,
            parentId: teamFolders[1].id,
            name: '原型图.png',
            type: 'file',
            fileType: 'image',
            content: 'https://picsum.photos/800/600',
            ownerType: 'team',
            ownerId: null,
            status: 'synced',
            modifiedAt: new Date('2024-01-10T13:00:00Z').toISOString(),
            createdAt: new Date('2024-01-10T13:00:00Z').toISOString(),
        },
    ]);

    // Insert private files with correct parentId references
    await db.insert(files).values([
        {
            projectId: 1,
            parentId: privateFolders[0].id,
            name: '开发日志.txt',
            type: 'file',
            fileType: 'txt',
            content: '2024-01-15: 完成数据库设计\n2024-01-16: 开始API开发',
            ownerType: 'private',
            ownerId: 1,
            status: 'modified',
            modifiedAt: new Date('2024-01-16T16:30:00Z').toISOString(),
            createdAt: new Date('2024-01-12T10:30:00Z').toISOString(),
        },
        {
            projectId: 1,
            parentId: privateFolders[1].id,
            name: 'utils.ts',
            type: 'file',
            fileType: 'code',
            content: 'export const formatDate = (date: Date) => {\n  return date.toISOString();\n};',
            ownerType: 'private',
            ownerId: 2,
            status: 'synced',
            modifiedAt: new Date('2024-01-11T15:00:00Z').toISOString(),
            createdAt: new Date('2024-01-11T15:00:00Z').toISOString(),
        },
        {
            projectId: 1,
            parentId: privateFolders[1].id,
            name: 'api-helpers.ts',
            type: 'file',
            fileType: 'code',
            content: 'export const handleError = (error: Error) => {\n  console.error(error);\n};',
            ownerType: 'private',
            ownerId: 2,
            status: 'new',
            modifiedAt: new Date('2024-01-16T09:00:00Z').toISOString(),
            createdAt: new Date('2024-01-16T09:00:00Z').toISOString(),
        },
    ]);

    console.log('✅ Files seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});