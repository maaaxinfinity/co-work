import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

// Projects table - 项目管理
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status').notNull().default('unsaved'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Users table - 用户信息
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Project Members table - 项目成员关系
export const projectMembers = pgTable('project_members', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id),
  userId: integer('user_id').notNull().references(() => users.id),
  role: text('role').notNull().default('viewer'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Files table - 文件树结构（支持团队/私有）
export const files = pgTable('files', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id),
  parentId: integer('parent_id').references(() => files.id),
  name: text('name').notNull(),
  type: text('type').notNull(),
  fileType: text('file_type'),
  content: text('content'),
  ownerType: text('owner_type').notNull(),
  ownerId: integer('owner_id').references(() => users.id),
  status: text('status').notNull().default('synced'),
  modifiedAt: timestamp('modified_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Messages table - AI聊天消息
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').notNull().references(() => projects.id),
  role: text('role').notNull(),
  content: text('content').notNull(),
  quotedMessageId: integer('quoted_message_id').references(() => messages.id),
  pinned: boolean('pinned').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Message Context Files table - 消息关联的上下文文件
export const messageContextFiles = pgTable('message_context_files', {
  id: serial('id').primaryKey(),
  messageId: integer('message_id').notNull().references(() => messages.id),
  fileId: integer('file_id').notNull().references(() => files.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Comments table - 文档评论
export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  fileId: integer('file_id').notNull().references(() => files.id),
  parentCommentId: integer('parent_comment_id').references(() => comments.id),
  author: text('author').notNull(),
  content: text('content').notNull(),
  resolved: boolean('resolved').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Versions table - 文件版本历史
export const versions = pgTable('versions', {
  id: serial('id').primaryKey(),
  fileId: integer('file_id').notNull().references(() => files.id),
  title: text('title').notNull(),
  author: text('author').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Tasks table - AI任务
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  fileId: integer('file_id').notNull().references(() => files.id),
  title: text('title').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});