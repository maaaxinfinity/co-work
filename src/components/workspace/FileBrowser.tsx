"use client";

import { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  Search,
  MoreVertical,
  Users,
  Lock,
  FileText,
  FileCode,
  Image as ImageIcon,
  FileType as FileTypeIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
// Tabs removed: we now show Team and Private simultaneously stacked vertically
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Badge } from "@/components/ui/badge";
import { useWorkspace, WorkspaceFile } from "@/hooks/useWorkspaceStore";
import { filesApi } from "@/lib/api-client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";

export default function FileBrowser() {
  const { state, actions } = useWorkspace();
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set([1, 2, 3]));
  const [searchQuery, setSearchQuery] = useState("");

  // 对话框状态
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTargetId, setMoveTargetId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [ctxNode, setCtxNode] = useState<WorkspaceFile | null>(null);
  const [propsOpen, setPropsOpen] = useState(false);
  const [blankMenuOwner, setBlankMenuOwner] = useState<"team" | "private" | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragDepth, setDragDepth] = useState(0);

  const teamFiles = state.teamFiles;
  const privateFiles = state.privateFiles;
  const selectedFile = state.selectedFileId;

  const toggleFolder = (id: number) => {
    const s = new Set(expandedFolders);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpandedFolders(s);
  };

  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case "code":
        return <FileCode className="w-4 h-4" />;
      case "image":
        return <ImageIcon className="w-4 h-4" />;
      case "doc":
      case "docx":
        return <FileTypeIcon className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "modified":
        return "text-yellow-500";
      case "new":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getAllFolders = (nodes: WorkspaceFile[]) => {
    const res: { id: number; name: string }[] = [];
    const dfs = (ns: WorkspaceFile[]) => {
      ns.forEach((n) => {
        if (n.type === "folder") res.push({ id: n.id, name: n.name });
        if (n.children) dfs(n.children);
      });
    };
    dfs(nodes);
    return res;
  };

  const allFolders = useMemo(() => getAllFolders([...teamFiles, ...privateFiles]), [teamFiles, privateFiles]);

  // 计算针对“新建”时的目标父级
  const getCreateTarget = (owner: "team" | "private", baseNode?: WorkspaceFile | null) => {
    let parentId: number | null = null;
    let ownerType: "team" | "private" = owner;

    if (baseNode) {
      ownerType = baseNode.ownerType || ownerType;
      if (baseNode.type === "folder") parentId = baseNode.id;
      else parentId = baseNode.parentId ?? null;
    } else {
      // 若没有上下文，尝试使用当前选中的文件夹（同归属）
      const sel = actions.getSelectedFile?.();
      if (sel && sel.ownerType === owner && sel.type === "folder") parentId = sel.id;
    }
    return { parentId, ownerType } as { parentId: number | null; ownerType: "team" | "private" };
  };

  // 搜索过滤功能
  const filterFiles = (nodes: WorkspaceFile[], query: string): WorkspaceFile[] => {
    if (!query.trim()) return nodes;
    
    const lowerQuery = query.toLowerCase();
    const filtered: WorkspaceFile[] = [];
    
    const matchesSearch = (node: WorkspaceFile): boolean => {
      return node.name.toLowerCase().includes(lowerQuery);
    };
    
    const filterNode = (node: WorkspaceFile): WorkspaceFile | null => {
      if (node.type === "file") {
        return matchesSearch(node) ? node : null;
      }
      
      // 对于文件夹，递归过滤子节点
      if (node.type === "folder") {
        const filteredChildren = node.children
          ?.map(child => filterNode(child))
          .filter(child => child !== null) as WorkspaceFile[] | undefined;
        
        // 如果文件夹名称匹配或有匹配的子节点，则包含该文件夹
        if (matchesSearch(node) || (filteredChildren && filteredChildren.length > 0)) {
          return {
            ...node,
            children: filteredChildren || node.children
          };
        }
      }
      
      return null;
    };
    
    nodes.forEach(node => {
      const filteredNode = filterNode(node);
      if (filteredNode) filtered.push(filteredNode);
    });
    
    return filtered;
  };

  // 自动展开包含搜索结果的文件夹
  const autoExpandMatchingFolders = (nodes: WorkspaceFile[], query: string) => {
    if (!query.trim()) return;
    
    const lowerQuery = query.toLowerCase();
    const foldersToExpand = new Set(expandedFolders);
    
    const checkAndExpand = (node: WorkspaceFile): boolean => {
      let hasMatch = false;
      
      if (node.name.toLowerCase().includes(lowerQuery)) {
        hasMatch = true;
      }
      
      if (node.type === "folder" && node.children) {
        for (const child of node.children) {
          if (checkAndExpand(child)) {
            hasMatch = true;
            foldersToExpand.add(node.id);
          }
        }
      }
      
      return hasMatch;
    };
    
    nodes.forEach(node => checkAndExpand(node));
    setExpandedFolders(foldersToExpand);
  };

  // 应用搜索过滤
  const filteredTeamFiles = useMemo(() => {
    const filtered = filterFiles(teamFiles, searchQuery);
    if (searchQuery.trim()) {
      autoExpandMatchingFolders(teamFiles, searchQuery);
    }
    return filtered;
  }, [teamFiles, searchQuery]);

  const filteredPrivateFiles = useMemo(() => {
    const filtered = filterFiles(privateFiles, searchQuery);
    if (searchQuery.trim()) {
      autoExpandMatchingFolders(privateFiles, searchQuery);
    }
    return filtered;
  }, [privateFiles, searchQuery]);

  // 高亮搜索文本
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) return text;
    
    return (
      <>
        {text.substring(0, index)}
        <span className="bg-yellow-200 dark:bg-yellow-900 text-foreground">
          {text.substring(index, index + query.length)}
        </span>
        {text.substring(index + query.length)}
      </>
    );
  };

  // 格式化时间
  const formatModifiedTime = (timestamp?: string) => {
    if (!timestamp) return "";
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

  const renderFileTree = (nodes: WorkspaceFile[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.id}>
        <ContextMenu onOpenChange={(open) => {
          if (!open) return;
          setCtxNode(node);
        }}>
          <ContextMenuTrigger asChild>
            <div
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer ${
                selectedFile === node.id ? "bg-accent" : ""
              }`}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onContextMenu={() => setCtxNode(node)}
              onClick={() =>
                node.type === "folder" ? toggleFolder(node.id) : actions.selectFile(node.id)
              }
            >
              {node.type === "folder" ? (
                <>
                  {expandedFolders.has(node.id) ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  )}
                  <Folder className="w-4 h-4 flex-shrink-0 text-blue-500" />
                </>
              ) : (
                <>
                  <span className="w-4 flex-shrink-0" />
                  <span className={getStatusColor(node.status)}>
                    {getFileIcon(node.fileType)}
                  </span>
                </>
              )}
              <span className="text-sm flex-1 truncate">
                {highlightText(node.name, searchQuery)}
              </span>
              {node.modifiedAt && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatModifiedTime(node.modifiedAt)}
                </span>
              )}
              {node.status === "modified" && (
                <Badge variant="outline" className="h-5 px-1 text-xs">改</Badge>
              )}
              {node.status === "new" && (
                <Badge variant="outline" className="h-5 px-1 text-xs">新</Badge>
              )}
              {node.ownerType !== "team" && (
                <MoreVertical className="w-4 h-4 opacity-50" />
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            {node.ownerType === 'team' ? (
              // 团队文件只读：仅允许查看属性
              <>
                <ContextMenuItem onClick={() => setPropsOpen(true)}>属性</ContextMenuItem>
              </>
            ) : (
              <>
                <ContextMenuItem onClick={() => actions.selectFile(node.id)}>打开</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => { setRenameOpen(true); setRenameValue(node.name); }}>重命名</ContextMenuItem>
                <ContextMenuItem onClick={() => setMoveOpen(true)}>移动</ContextMenuItem>
                <ContextMenuItem onClick={() => setDeleteOpen(true)}>删除</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => handleDownload(node)}>下载</ContextMenuItem>
                <ContextMenuItem onClick={() => setPropsOpen(true)}>属性</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={async () => {
                  const { parentId, ownerType } = getCreateTarget(node.ownerType || "private", node);
                  await actions.addFile(parentId, {
                    name: "新建文件.md",
                    type: "file",
                    fileType: "md",
                    content: "# 新建文档\n\n",
                    ownerType,
                  });
                }}>新建文件</ContextMenuItem>
                <ContextMenuItem onClick={async () => {
                  const { parentId, ownerType } = getCreateTarget(node.ownerType || "private", node);
                  await actions.addFile(parentId, {
                    name: "新建文件夹",
                    type: "folder",
                    ownerType,
                  });
                }}>新建文件夹</ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>
        {node.type === "folder" &&
          expandedFolders.has(node.id) &&
          node.children &&
          renderFileTree(node.children, level + 1)}
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* 搜索 */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="搜索文件..." 
            className="pl-9 h-9" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) {
                toast.info(`搜索: ${e.target.value}`, {
                  description: "已自动展开匹配的文件夹"
                });
              }
            }}
          />
        </div>
      </div>
      {/* 上下分区文件树 */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* 团队共享 */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="px-4 py-2 text-xs text-muted-foreground flex items-center gap-2 border-b">
            <Users className="w-4 h-4" />
            团队文件
          </div>
          <div className="h-full">
            <ScrollArea className="h-full">
              {state.isLoading ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground">加载中...</div>
              ) : (
                <div className="p-2">
                  {filteredTeamFiles.length > 0 ? (
                    renderFileTree(filteredTeamFiles)
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-6">
                      {searchQuery.trim() ? "未找到匹配的文件" : "暂无文件"}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* 分割线 */}
        <div className="h-px bg-border" />

        {/* 私有文件（支持拖入上传） */}
        <div className="flex-1 min-h-0 flex flex-col relative">
          <div className="px-4 py-2 text-xs text-muted-foreground flex items-center gap-2 border-b">
            <Lock className="w-4 h-4" />
            私有文件
          </div>
          <ContextMenu onOpenChange={(open) => {
            if (open) {
              setCtxNode(null);
              setBlankMenuOwner("private");
            }
          }}>
            <ContextMenuTrigger asChild>
              <div
                className="h-full"
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragDepth((d) => d + 1);
                  setDragActive(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragDepth((d) => {
                    const nd = Math.max(0, d - 1);
                    if (nd === 0) setDragActive(false);
                    return nd;
                  });
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragActive(false);
                  setDragDepth(0);
                  const files = Array.from(e.dataTransfer.files || []);
                  if (!files.length) return;

                  // 选择目标：若当前选中为私有文件夹，则投递到该文件夹，否则投到私有根
                  let targetParent: number | null = null;
                  const sel = actions.getSelectedFile?.();
                  if (sel && sel.ownerType === "private" && sel.type === "folder") targetParent = sel.id;

                  const allowed = new Set(["md", "txt", "docx", "doc"]);
                  const results: string[] = [];
                  for (const f of files) {
                    try {
                      const ext = f.name.split('.').pop()?.toLowerCase() || '';
                      if (!allowed.has(ext)) {
                        results.push(`${f.name} 不支持的格式`);
                        continue;
                      }
                      if (f.size > 5 * 1024 * 1024) { // 临时限制 5MB
                        results.push(`${f.name} 超过 5MB 限制`);
                        continue;
                      }

                      const fd = new FormData();
                      fd.append('file', f);
                      fd.append('projectId', String(state.projectId));
                      fd.append('ownerType', 'private');
                      if (targetParent !== null) fd.append('parentId', String(targetParent));

                      await filesApi.upload(fd);
                      results.push(`${f.name} 上传成功`);
                    } catch (err) {
                      console.error(err);
                      results.push(`${f.name} 上传失败`);
                    }
                  }
                  await actions.refreshFiles();
                  toast.message('上传结果', { description: results.join('\n') });
                }}
              >
                <ScrollArea className="h-full">
                  {state.isLoading ? (
                    <div className="flex items-center justify-center h-40 text-muted-foreground">加载中...</div>
                  ) : (
                    <div className="p-2">
                      {filteredPrivateFiles.length > 0 ? (
                        renderFileTree(filteredPrivateFiles)
                      ) : (
                        <div className="text-center text-sm text-muted-foreground py-6">
                          {searchQuery.trim() ? "未找到匹配的文件" : "暂无文件"}
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {/* 拖入遮罩层 */}
                {dragActive && (
                  <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center pointer-events-none">
                    <div className="text-sm text-primary">释放即可上传到私有文件{actions.getSelectedFile?.()?.type === 'folder' && actions.getSelectedFile?.()?.ownerType === 'private' ? `（${actions.getSelectedFile?.()?.name}）` : "（根目录）"}</div>
                  </div>
                )}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={async () => {
                const { parentId, ownerType } = getCreateTarget("private", null);
                await actions.addFile(parentId, {
                  name: "新建文件.md",
                  type: "file",
                  fileType: "md",
                  content: "# 新建文档\n\n",
                  ownerType,
                });
              }}>新建文件</ContextMenuItem>
              <ContextMenuItem onClick={async () => {
                const { parentId, ownerType } = getCreateTarget("private", null);
                await actions.addFile(parentId, {
                  name: "新建文件夹",
                  type: "folder",
                  ownerType,
                });
              }}>新建文件夹</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </div>

      {/* 重命名对话框 */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名</DialogTitle>
          </DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRenameOpen(false)}>取消</Button>
            <Button
              onClick={async () => {
                if (ctxNode) await actions.renameFile(ctxNode.id, renameValue.trim() || ctxNode.name);
                setRenameOpen(false);
              }}
            >确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 移动对话框 */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>移动到</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">选择目标文件夹</div>
            <div className="max-h-48 overflow-auto border rounded-md">
              {allFolders.map((f) => (
                <button
                  key={f.id}
                  className={`w-full text-left px-3 py-2 hover:bg-accent ${moveTargetId === f.id ? "bg-accent" : ""}`}
                  onClick={() => setMoveTargetId(f.id)}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setMoveOpen(false)}>取消</Button>
            <Button
              disabled={!moveTargetId || !ctxNode}
              onClick={async () => {
                if (ctxNode && moveTargetId) await actions.moveFile(ctxNode.id, moveTargetId);
                setMoveOpen(false);
                setMoveTargetId(null);
              }}
            >
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作不可撤销，将从数据库中永久删除该文件或文件夹。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (ctxNode) await actions.deleteFile(ctxNode.id);
                setDeleteOpen(false);
              }}
            >删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 属性对话框 */}
      <Dialog open={propsOpen} onOpenChange={setPropsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>属性</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">名称：</span>{ctxNode?.name || "-"}</div>
            <div><span className="text-muted-foreground">类型：</span>{ctxNode?.type === 'folder' ? '文件夹' : '文件'}</div>
            <div><span className="text-muted-foreground">所属：</span>{ctxNode?.ownerType === 'team' ? '团队' : '私有'}</div>
            {ctxNode?.fileType && (<div><span className="text-muted-foreground">文件格式：</span>{ctxNode.fileType}</div>)}
            {ctxNode?.modifiedAt && (<div><span className="text-muted-foreground">修改时间：</span>{formatModifiedTime(ctxNode.modifiedAt)}</div>)}
          </div>
          <DialogFooter>
            <Button onClick={() => setPropsOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 简单的前端下载实现；若无内容则提示
function handleDownload(node: WorkspaceFile) {
  if (node.type === 'folder') {
    toast.info('暂不支持下载文件夹');
    return;
  }
  const name = node.name || '未命名文件';
  const content = node.content;
  if (!content) {
    toast.info('无法下载：未发现文件内容');
    return;
  }
  try {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('下载已开始');
  } catch (e) {
    console.error(e);
    toast.error('下载失败');
  }
}
