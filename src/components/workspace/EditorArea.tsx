"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Download,
  Upload,
  FileText,
  MessageSquare,
  Clock,
  CheckSquare,
  PanelRightClose,
  PanelRightOpen,
  ZoomIn,
  ZoomOut,
  Wifi,
  Plus,
  Check,
  X,
  RotateCcw,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import dynamic from "next/dynamic";
import { useWorkspace } from "@/hooks/useWorkspaceStore";
import { toast } from "sonner";

// 动态导入编辑器以避免SSR问题
const MarkdownEditor = dynamic(() => import("./editors/MarkdownEditor"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">加载编辑器中...</div>
});

const DocxEditor = dynamic(() => import("./editors/DocxEditor"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">加载编辑器中...</div>
});

const TextEditor = dynamic(() => import("./editors/TextEditor"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">加载编辑器中...</div>
});

interface EditorAreaProps {
  currentFile?: {
    name: string;
    type: string;
    content?: string;
  };
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  resolved: boolean;
  replies?: { id: string; author: string; content: string; timestamp: string }[];
}

interface OutlineItem {
  id: string;
  title: string;
  level: number;
  page: number;
}

interface Version {
  id: string;
  title: string;
  author: string;
  timestamp: string;
}

interface Task {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
}

export default function EditorArea({ currentFile }: EditorAreaProps) {
  const { actions } = useWorkspace();
  const selected = actions.getSelectedFile();
  const isReadOnly = selected?.ownerType === "team";

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [wordCount, setWordCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState<string>("");

  // 评论相关状态
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: "张三",
      content: "这个部分需要补充更多示例吗？",
      timestamp: "2小时前",
      resolved: false,
      replies: [],
    },
    {
      id: "2",
      author: "李四",
      content: "引言部分写得很好！",
      timestamp: "5小时前",
      resolved: true,
      replies: [
        { id: "r1", author: "王五", content: "我也这么觉得", timestamp: "4小时前" }
      ],
    },
  ]);
  const [newCommentOpen, setNewCommentOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // 大纲数据
  const [outline] = useState<OutlineItem[]>([
    { id: "1", title: "引言", level: 1, page: 1 },
    { id: "2", title: "背景介绍", level: 2, page: 1 },
    { id: "3", title: "方法论", level: 1, page: 2 },
    { id: "4", title: "研究设计", level: 2, page: 2 },
    { id: "5", title: "数据收集", level: 2, page: 2 },
    { id: "6", title: "结果", level: 1, page: 3 },
    { id: "7", title: "讨论", level: 1, page: 3 },
  ]);

  // 版本历史
  const [versions] = useState<Version[]>([
    { id: "1", title: "更新结论部分", author: "我", timestamp: "2小时前" },
    { id: "2", title: "添加方法论细节", author: "张三", timestamp: "5小时前" },
    { id: "3", title: "初始草稿", author: "我", timestamp: "1天前" },
  ]);

  // AI任务
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "审阅引言部分", status: "pending" },
    { id: "2", title: "添加参考文献", status: "in_progress" },
    { id: "3", title: "校对文档", status: "completed" },
  ]);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const activeFile = useMemo(() => {
    if (selected) {
      return { name: selected.name || "未命名", content: selected.content };
    }
    if (currentFile) return currentFile;
    return { name: "未命名.docx", content: undefined };
  }, [selected, currentFile]);

  const getEditorType = () => {
    const fileName = (activeFile?.name || "").toLowerCase();
    if (fileName.endsWith(".md") || fileName.endsWith(".markdown")) {
      return "markdown";
    } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      return "docx";
    } else if (fileName.endsWith(".txt") || fileName.endsWith(".text")) {
      return "text";
    }
    return "docx";
  };

  const editorType = getEditorType();

  const handleWordCountUpdate = (count: number) => {
    setWordCount(count);
  };

  const handleContentChange = (content: string) => {
    if (isReadOnly) return;
    setIsDirty(true);
    setDraftContent(content);
    // In a more advanced setup, we would keep per-file local draft state here
  };

  // Keep draft in sync when switching files
  useEffect(() => {
    setDraftContent(activeFile?.content || "");
    setIsDirty(false);
  }, [activeFile?.content]);

  // Auto-save every 5s if there are unsaved changes
  useEffect(() => {
    if (isReadOnly) return;
    const id = window.setInterval(async () => {
      if (!isDirty) return;
      if (!selected?.id) return;
      try {
        await actions.updateFileContent(selected.id, draftContent);
        setIsDirty(false);
        setLastSavedAt(new Date().toLocaleTimeString());
      } catch {
        // errors are surfaced in the action via toast
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, [isDirty, selected?.id, draftContent, actions, isReadOnly]);

  // 大纲点击滚动
  const handleOutlineClick = (item: OutlineItem) => {
    toast.success(`跳转到: ${item.title} (第${item.page}页)`, {
      description: "在实际应用中会滚动到对应位置"
    });
  };

  // 添加评论
  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newComment: Comment = {
      id: `c${Date.now()}`,
      author: "我",
      content: newCommentText,
      timestamp: "刚刚",
      resolved: false,
      replies: [],
    };
    setComments([...comments, newComment]);
    setNewCommentText("");
    setNewCommentOpen(false);
    toast.success("评论已添加");
  };

  // 回复评论
  const handleReplyComment = (commentId: string) => {
    if (!replyText.trim()) return;
    const newReply = {
      id: `r${Date.now()}`,
      author: "我",
      content: replyText,
      timestamp: "刚刚",
    };
    setComments(comments.map(c => {
      if (c.id === commentId) {
        return { ...c, replies: [...(c.replies || []), newReply] };
      }
      return c;
    }));
    setReplyText("");
    setReplyingToId(null);
    toast.success("回复已添加");
  };

  // 解决/重新打开评论
  const handleToggleResolveComment = (commentId: string) => {
    setComments(comments.map(c => {
      if (c.id === commentId) {
        const newResolved = !c.resolved;
        toast.success(newResolved ? "评论已标记为解决" : "评论已重新打开");
        return { ...c, resolved: newResolved };
      }
      return c;
    }));
  };

  // 删除评论
  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter(c => c.id !== commentId));
    toast.success("评论已删除");
  };

  // 查看版本历史
  const handleViewVersion = (version: Version) => {
    toast.info(`查看版本: ${version.title}`, {
      description: `作者: ${version.author} • ${version.timestamp}`
    });
  };

  // 恢复版本
  const handleRestoreVersion = (version: Version) => {
    toast.success(`已恢复版本: ${version.title}`, {
      description: "在实际应用中会将文档内容恢复到此版本"
    });
  };

  // 添加AI任务
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: `t${Date.now()}`,
      title: newTaskTitle,
      status: "pending",
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
    setNewTaskOpen(false);
    toast.success("任务已添加");
  };

  // 切换任务状态
  const handleToggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        let newStatus: Task["status"];
        if (t.status === "pending") newStatus = "in_progress";
        else if (t.status === "in_progress") newStatus = "completed";
        else newStatus = "pending";
        
        const statusText = newStatus === "completed" ? "已完成" : newStatus === "in_progress" ? "进行中" : "待处理";
        toast.success(`任务状态已更新为: ${statusText}`);
        return { ...t, status: newStatus };
      }
      return t;
    }));
  };

  // 删除任务
  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    toast.success("任务已删除");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 编辑器 + 侧边栏 */}
      <div className="flex-1 flex overflow-hidden bg-muted/20">
        {/* 编辑器容器 */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {isReadOnly && (
            <div className="absolute top-3 left-3 z-20">
              <Badge variant="secondary" className="gap-1 text-xs">
                <Lock className="w-3 h-3" />
                团队文件（只读）
              </Badge>
            </div>
          )}
          {editorType === "docx" && (
            <DocxEditor
              onWordCountUpdate={handleWordCountUpdate}
              onPageCountUpdate={setPageCount}
              zoom={zoom}
              readOnly={isReadOnly}
            />
          )}
          {editorType === "markdown" && (
            <MarkdownEditor
              onWordCountUpdate={handleWordCountUpdate}
              initialContent={activeFile?.content}
              onChange={handleContentChange}
              readOnly={isReadOnly}
            />
          )}
          {editorType === "text" && (
            <TextEditor
              onWordCountUpdate={handleWordCountUpdate}
              initialContent={activeFile?.content}
              onChange={handleContentChange}
              readOnly={isReadOnly}
            />
          )}
        </div>

        {/* 右侧边栏 */}
        {sidebarOpen && (
          <div className="w-80 border-l border-border bg-background flex flex-col">
            <div className="flex items-center justify-between p-2 border-b border-border">
              <h3 className="text-sm font-semibold px-2">侧边栏</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <PanelRightClose className="w-4 h-4" />
              </Button>
            </div>
            <Tabs defaultValue="outline" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="m-2 grid grid-cols-4">
                <TabsTrigger value="outline" className="text-xs">
                  <FileText className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="comments" className="text-xs">
                  <MessageSquare className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs">
                  <Clock className="w-3 h-3" />
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs">
                  <CheckSquare className="w-3 h-3" />
                </TabsTrigger>
              </TabsList>

              {/* 大纲 */}
              <TabsContent value="outline" className="flex-1 mt-0 overflow-hidden">
                <div className="p-3 border-b border-border">
                  <h3 className="text-sm font-semibold">文档大纲</h3>
                </div>
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                    {outline.map((item) => (
                      <button
                        key={item.id}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm transition-colors"
                        style={{ paddingLeft: `${item.level * 16 + 12}px` }}
                        onClick={() => handleOutlineClick(item)}
                      >
                        <div className="flex items-center justify-between">
                          <span>{item.title}</span>
                          <Badge variant="outline" className="text-xs">
                            第{item.page}页
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* 评论 */}
              <TabsContent value="comments" className="flex-1 mt-0 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold">评论</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => setNewCommentOpen(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    添加
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-3">
                    {comments.map((comment) => (
                      <div 
                        key={comment.id} 
                        className={`border rounded-lg p-3 ${
                          comment.resolved 
                            ? "border-border bg-muted/50 opacity-60" 
                            : "border-primary/20 bg-primary/5"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-medium text-sm">{comment.author}</span>
                          <div className="flex items-center gap-1">
                            {comment.resolved && (
                              <Badge variant="outline" className="text-xs">已解决</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{comment.content}</p>
                        <span className="text-xs text-muted-foreground block mb-2">{comment.timestamp}</span>
                        
                        {/* 回复列表 */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border space-y-2">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="pl-2 border-l-2 border-muted">
                                <div className="text-xs font-medium">{reply.author}</div>
                                <div className="text-xs text-muted-foreground">{reply.content}</div>
                                <div className="text-xs text-muted-foreground/70">{reply.timestamp}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* 回复输入 */}
                        {replyingToId === comment.id ? (
                          <div className="mt-2 space-y-2">
                            <Textarea
                              placeholder="输入回复..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="min-h-[60px]"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleReplyComment(comment.id)}>
                                发送
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setReplyingToId(null)}>
                                取消
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => setReplyingToId(comment.id)}
                            >
                              回复
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => handleToggleResolveComment(comment.id)}
                            >
                              {comment.resolved ? "重新打开" : "标记为解决"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-destructive"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              删除
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* 版本历史 */}
              <TabsContent value="history" className="flex-1 mt-0 overflow-hidden">
                <div className="p-3 border-b border-border">
                  <h3 className="text-sm font-semibold">版本历史</h3>
                </div>
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-2">
                    {versions.map((version) => (
                      <div key={version.id} className="border border-border rounded-lg p-3 hover:bg-accent transition-colors">
                        <div className="font-medium text-sm mb-1">{version.title}</div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {version.author} • {version.timestamp}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => handleViewVersion(version)}
                          >
                            查看
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => handleRestoreVersion(version)}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            恢复
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* AI任务 */}
              <TabsContent value="tasks" className="flex-1 mt-0 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold">AI 任务</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={() => setNewTaskOpen(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    添加
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-2">
                    {tasks.map((task) => (
                      <div key={task.id} className="border border-border rounded-lg p-3 flex items-start gap-2">
                        <button 
                          className="mt-0.5 rounded border-border"
                          onClick={() => handleToggleTaskStatus(task.id)}
                        >
                          {task.status === "completed" ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : task.status === "in_progress" ? (
                            <div className="w-4 h-4 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />
                          ) : (
                            <div className="w-4 h-4 rounded border-2 border-muted" />
                          )}
                        </button>
                        <div className="flex-1">
                          <span className={`text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </span>
                          {task.status === "in_progress" && (
                            <Badge variant="secondary" className="text-xs ml-2">进行中</Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* 侧边栏折叠按钮 */}
        {!sidebarOpen && (
          <div className="absolute top-4 right-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <PanelRightOpen className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* 添加评论对话框 */}
      <Dialog open={newCommentOpen} onOpenChange={setNewCommentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加评论</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="输入评论内容..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setNewCommentOpen(false)}>取消</Button>
            <Button onClick={handleAddComment}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加任务对话框 */}
      <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加 AI 任务</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="输入任务标题..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setNewTaskOpen(false)}>取消</Button>
            <Button onClick={handleAddTask}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 状态栏 */}
      <div className="h-8 border-t border-border flex items-center px-4 gap-4 text-xs text-muted-foreground bg-background">
        <div className="flex items-center gap-1">
          <Wifi className="w-3 h-3 text-green-500" />
          <span>已连接</span>
        </div>
        <Separator orientation="vertical" className="h-4" />
        <span>{wordCount} 字</span>
        <Separator orientation="vertical" className="h-4" />
        <span>第 {pageCount} 页</span>
        <Separator orientation="vertical" className="h-4" />
        <span>
          {isDirty ? '有未保存更改' : (lastSavedAt ? `已保存于 ${lastSavedAt}` : '已保存')}
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-muted-foreground">编辑器: {
            editorType === "docx" ? "DOCX" : 
            editorType === "markdown" ? "Markdown" : 
            "文本"
          }</span>
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setZoom(Math.max(50, zoom - 10))}
          >
            <ZoomOut className="w-3 h-3" />
          </Button>
          <span className="min-w-[3rem] text-center">{zoom}%</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setZoom(Math.min(200, zoom + 10))}
          >
            <ZoomIn className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
