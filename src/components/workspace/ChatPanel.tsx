"use client";

import { useState, useMemo } from "react";
import { Pin, Quote, Send, Sparkles, X, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/hooks/useWorkspaceStore";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function ChatPanel() {
  const { state, actions } = useWorkspace();
  const [inputMessage, setInputMessage] = useState("");
  const [quotedId, setQuotedId] = useState<number | null>(null);
  const [contextFiles, setContextFiles] = useState<number[]>([]);

  const filtered = useMemo(() => {
    const q = (state.globalSearch || "").trim();
    if (!q) return state.messages;
    return state.messages.filter((m) => m.content.includes(q));
  }, [state.messages, state.globalSearch]);

  const handleSend = async () => {
    const text = inputMessage.trim();
    if (!text) return;
    await actions.sendMessage(text, quotedId);
    setInputMessage("");
    setQuotedId(null);
  };

  // 添加当前文件到上下文
  const handleAddCurrentFileToContext = () => {
    const selectedFile = actions.getSelectedFile();
    if (!selectedFile) {
      toast.error("请先选择一个文件");
      return;
    }
    
    if (contextFiles.includes(selectedFile.id)) {
      toast.info(`${selectedFile.name} 已在上下文中`);
      return;
    }
    
    setContextFiles([...contextFiles, selectedFile.id]);
    toast.success(`已将 ${selectedFile.name} 添加到 AI 上下文`, {
      description: "AI 将参考此文件内容回答问题"
    });
  };

  // 移除上下文文件
  const handleRemoveContextFile = (fileId: number) => {
    setContextFiles(contextFiles.filter(id => id !== fileId));
    toast.success("已从上下文中移除文件");
  };

  // 获取文件名
  // Efficient file name lookup using a memoized Map index
  const fileNameById = useMemo(() => {
    const map = new Map<number, string>();
    const index = (files: typeof state.teamFiles) => {
      files.forEach((f) => {
        map.set(f.id, f.name);
        if (f.children) index(f.children);
      });
    };
    index(state.teamFiles);
    index(state.privateFiles);
    return map;
  }, [state.teamFiles, state.privateFiles]);

  const getFileName = (fileId: number) => fileNameById.get(fileId) || "未知文件";

  // 格式化时间戳
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* 聊天头部 */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold">AI 助手</h2>
            <p className="text-xs text-muted-foreground">AI文档协作平台</p>
          </div>
          <Badge variant="secondary" className="text-xs">GPT-4</Badge>
        </div>
        
        {/* 上下文文件列表 */}
        {contextFiles.length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="text-xs text-muted-foreground mb-1">上下文文件:</div>
            {contextFiles.map((fileId) => (
              <div
                key={fileId}
                className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded text-xs"
              >
                <FileText className="w-3 h-3" />
                <span className="flex-1 truncate">{getFileName(fileId)}</span>
                <button
                  onClick={() => handleRemoveContextFile(fileId)}
                  className="hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 消息列表 */}
      <ScrollArea className="flex-1 p-4">
        {state.isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            加载消息中...
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 group ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex-1 rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.quotedMessageId && (
                    <div className="mb-2 text-xs opacity-80">
                      引用了消息 #{message.quotedMessageId}
                    </div>
                  )}
                  {/* Render content as Markdown; react-markdown escapes raw HTML by default, mitigating XSS */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs opacity-70">{formatTimestamp(message.createdAt)}</span>
                    {message.role === "assistant" && (
                      <div className="flex gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant={message.pinned ? "secondary" : "ghost"}
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => actions.pinMessage(message.id, !message.pinned)}
                        >
                          <Pin className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setQuotedId(message.id);
                            toast.success("已引用该消息");
                          }}
                        >
                          <Quote className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    {message.pinned && (
                      <Badge variant="outline" className="ml-auto h-5">已置顶</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* 输入区域 */}
      <div className="p-4 border-t border-border bg-background">
        {quotedId && (
          <div className="flex items-center justify-between text-xs mb-2 px-2 py-1 rounded bg-muted">
            正在引用消息 #{quotedId}
            <button className="opacity-70 hover:opacity-100" onClick={() => setQuotedId(null)}>
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="向 AI 提问关于文档的任何问题..."
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button size="icon" className="flex-shrink-0 h-[80px]" onClick={handleSend}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-7 gap-1" 
            onClick={handleAddCurrentFileToContext}
          >
            <Plus className="w-3 h-3" />
            添加当前文件到上下文
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={async () => {
              const lastAssistant = [...state.messages].reverse().find((m) => m.role === "assistant");
              if (lastAssistant) {
                await actions.pinMessage(lastAssistant.id, true);
                toast.success("已置顶最后一条 AI 回复");
              } else {
                toast.info("没有找到 AI 回复消息");
              }
            }}
          >
            置顶最后回复
          </Button>
        </div>
      </div>
    </div>
  );
}