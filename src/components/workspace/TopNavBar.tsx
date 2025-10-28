"use client";

import { Search, Share2, Circle, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useWorkspace } from "@/hooks/useWorkspaceStore";
import { toast } from "sonner";
import { useMemo, useState } from "react";

export default function TopNavBar() {
  const { state, actions } = useWorkspace();
  const [shareLink] = useState("https://example.com/share/abc123");
  const members = useMemo(
    () => [
      { id: 1, name: "张三", src: "https://i.pravatar.cc/150?img=1" },
      { id: 2, name: "李四", src: "https://i.pravatar.cc/150?img=2" },
      { id: 3, name: "王五", src: "https://i.pravatar.cc/150?img=3" },
    ],
    []
  );

  return (
    <div className="h-14 border-b border-border bg-background flex items-center px-4 gap-4">
      {/* 项目名称 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">工作区</span>
          <span className="text-muted-foreground">-</span>
          <h1 className="text-base font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            测试项目
          </h1>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10">
          <Circle className="w-2 h-2 fill-green-500 text-green-500" />
          <span className="text-xs font-medium text-green-600 dark:text-green-400">已保存</span>
        </div>
      </div>

      {/* 全局搜索 */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="搜索文档、对话、文件..."
          className="pl-9 h-9"
          value={state.globalSearch}
          onChange={(e) => actions.setGlobalSearch(e.target.value)}
        />
      </div>

      {/* 右侧操作 */}
      <div className="flex items-center gap-2 ml-auto">
        {/* 协作用户头像 */}
        <TooltipProvider>
          <div className="flex items-center -space-x-2">
            {members.map((m) => (
              <Tooltip key={m.id}>
                <TooltipTrigger>
                  <Avatar className="w-8 h-8 border-2 border-background">
                    <AvatarImage src={m.src} />
                    <AvatarFallback>{m.name}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>{m.name}</TooltipContent>
              </Tooltip>
            ))}
            <Tooltip>
              <TooltipTrigger>
                <Avatar className="w-8 h-8 border-2 border-background bg-muted">
                  <AvatarFallback>
                    <Users className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>还有3人在线</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* 分享按钮 */}
        <Button variant="outline" size="sm" className="gap-2" onClick={() => actions.setShareDialogOpen(true)}>
          <Share2 className="w-4 h-4" />
          分享
        </Button>
      </div>

      {/* 分享对话框（Mock） */}
      <Dialog open={state.shareDialogOpen} onOpenChange={(open) => actions.setShareDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分享文档</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">共享链接</div>
              <div className="flex gap-2">
                <Input readOnly value={shareLink} />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(shareLink);
                    toast.success("链接已复制");
                  }}
                >复制链接</Button>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2">协作者</div>
              <div className="flex -space-x-2">
                {members.map((m) => (
                  <Avatar key={m.id} className="w-8 h-8 border-2 border-background">
                    <AvatarImage src={m.src} />
                    <AvatarFallback>{m.name}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => actions.setShareDialogOpen(false)}>完成</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}