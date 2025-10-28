"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TextEditorProps {
  onWordCountUpdate?: (count: number) => void;
  initialContent?: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

const DEFAULT_TEXT =
  "欢迎使用文本编辑器\n\n这是一个简洁的纯文本编辑器，适合编辑 .txt 文件。\n\n开始输入你的内容...";

export default function TextEditor({
  onWordCountUpdate,
  initialContent = DEFAULT_TEXT,
  onChange,
  readOnly = false,
}: TextEditorProps) {
  const [content, setContent] = useState(initialContent ?? DEFAULT_TEXT);

  useEffect(() => {
    setContent(initialContent ?? DEFAULT_TEXT);
  }, [initialContent]);

  useEffect(() => {
    if (onWordCountUpdate) {
      onWordCountUpdate((content ?? "").length);
    }
  }, [content, onWordCountUpdate]);

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="border-b border-border bg-background">
        <div className="h-12 flex items-center px-4 gap-2 justify-between">
          <div className="text-sm text-muted-foreground">纯文本编辑器</div>
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
                  <span className="text-xs">下载 TXT</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>下载为文本文件</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* 编辑器内容 */}
      <textarea
        className="flex-1 w-full p-6 bg-background text-foreground resize-none focus:outline-none font-mono text-sm leading-relaxed"
        value={content}
        onChange={(e) => {
          if (readOnly) return;
          const v = e.target.value;
          setContent(v);
          onChange?.(v);
        }}
        placeholder="开始输入文本..."
        readOnly={readOnly}
        aria-readonly={readOnly}
      />
    </div>
  );
}
