#!/bin/bash

echo "🔧 Co-Work 开发环境初始化脚本"
echo ""

# 检查 PostgreSQL 是否运行
echo "📊 检查 PostgreSQL 状态..."
if ! sudo systemctl is-active --quiet postgresql; then
    echo "⚠️  PostgreSQL 未运行，正在启动..."
    sudo systemctl start postgresql
fi

# 设置 postgres 密码
echo "🔐 设置 PostgreSQL 密码..."
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';" 2>/dev/null || echo "密码已设置"

# 检查数据库是否存在
echo "📦 检查数据库 workspace_db..."
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw workspace_db; then
    echo "✅ 数据库已存在"
else
    echo "🔨 创建数据库 workspace_db..."
    sudo -u postgres createdb workspace_db
fi

# 推送数据库 schema
echo "🗄️  初始化数据库表结构..."
bunx drizzle-kit push

echo ""
echo "✅ 初始化完成！"
echo ""
echo "🚀 启动开发服务器: npm run dev"
echo "📊 查看数据库: bunx drizzle-kit studio"
echo ""
