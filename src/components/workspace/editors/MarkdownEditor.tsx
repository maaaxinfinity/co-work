"use client";

import { useState, useEffect } from "react";
import { Download, Eye, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ReactMarkdown from "react-markdown";

interface MarkdownEditorProps {
  onWordCountUpdate?: (count: number) => void;
  initialContent?: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

const DEFAULT_CONTENT =
  "# 欢迎使用 Markdown 编辑器\n\n这是一个功能完整的 Markdown 编辑器。\n\n## 支持的功能\n\n- **粗体文本**\n- *斜体文本*\n- ~~删除线~~\n- `行内代码`\n- [链接](https://example.com)\n- 列表\n- 任务列表\n\n## 代码块\n\n```javascript\nfunction hello() {\n  console.log('Hello, World!');\n}\n```\n\n## 引用\n\n> 这是一段引用文本\n\n## 表格\n\n| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 数据1 | 数据2 | 数据3 |\n\n## 开始编辑\n\n现在你可以开始编辑你的 Markdown 文档了！";

export default function MarkdownEditor({
  onWordCountUpdate,
  initialContent = DEFAULT_CONTENT,
  onChange,
  readOnly = false,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent ?? DEFAULT_CONTENT);
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("split");

  useEffect(() => {
    setContent(initialContent ?? DEFAULT_CONTENT);
  }, [initialContent]);

  useEffect(() => {
    if (onWordCountUpdate) {
      // 移除Markdown语法后计算字数
      const plainText = (content ?? "").replace(/[#*`~\[\]()]/g, "").trim();
      onWordCountUpdate(plainText.length);
    }
  }, [content, onWordCountUpdate]);

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="border-b border-border bg-background">
        <div className="h-12 flex items-center px-4 gap-2 justify-between">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "edit" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8"
                    onClick={() => setViewMode("edit")}
                  >
                    <Code className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>编辑模式</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "split" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8"
                    onClick={() => setViewMode("split")}
                  >
                    <span className="text-xs font-medium">分屏</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>分屏模式</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "preview" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-8"
                    onClick={() => setViewMode("preview")}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>预览模式</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4" />
                  <span className="text-xs">下载 MD</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>下载为 Markdown 文件</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* 编辑器内容 */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "edit" && (
          <textarea
            className="w-full h-full p-6 bg-background text-foreground resize-none focus:outline-none font-mono"
            value={content}
            onChange={(e) => {
              if (readOnly) return;
              const v = e.target.value;
              setContent(v);
              onChange?.(v);
            }}
            placeholder="开始输入 Markdown..."
            readOnly={readOnly}
            aria-readonly={readOnly}
          />
        )}

        {viewMode === "preview" && (
          <div className="w-full h-full overflow-auto p-6">
            <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        )}

        {viewMode === "split" && (
          <div className="flex h-full">
            <div className="flex-1 border-r border-border">
              <textarea
                className="w-full h-full p-6 bg-background text-foreground resize-none focus:outline-none font-mono"
                value={content}
                onChange={(e) => {
                  if (readOnly) return;
                  const v = e.target.value;
                  setContent(v);
                  onChange?.(v);
                }}
                placeholder="开始输入 Markdown..."
                readOnly={readOnly}
                aria-readonly={readOnly}
              />
            </div>
            <div className="flex-1 overflow-auto p-6 bg-muted/20">
              <div className="max-w-4xl mx-auto prose prose-slate dark:prose-invert">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
