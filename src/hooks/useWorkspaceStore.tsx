"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { filesApi, messagesApi } from "@/lib/api-client";

export type FileKind = "file" | "folder";
export type FileType = "docx" | "doc" | "md" | "txt" | "code" | "image";

export interface WorkspaceFile {
  id: number;
  name: string;
  type: FileKind;
  children?: WorkspaceFile[];
  modifiedAt?: string;
  status?: "modified" | "new" | "synced";
  fileType?: FileType;
  content?: string;
  parentId?: number | null;
  projectId?: number;
  ownerType?: "team" | "private";
  ownerId?: number | null;
}

export interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  pinned?: boolean;
  quotedMessageId?: number | null;
}

interface WorkspaceState {
  projectId: number;
  teamFiles: WorkspaceFile[];
  privateFiles: WorkspaceFile[];
  selectedFileId: number | null;
  messages: Message[];
  globalSearch: string;
  shareDialogOpen: boolean;
  isLoading: boolean;
}

interface WorkspaceContextValue {
  state: WorkspaceState;
  actions: {
    selectFile: (id: number | null) => void;
    renameFile: (id: number, name: string) => Promise<void>;
    deleteFile: (id: number) => Promise<void>;
    addFile: (parentId: number | null, file: Partial<WorkspaceFile>) => Promise<void>;
    moveFile: (id: number, targetFolderId: number) => Promise<void>;
    setGlobalSearch: (value: string) => void;
    setShareDialogOpen: (value: boolean) => void;
    sendMessage: (content: string, quotedId?: number | null) => Promise<void>;
    pinMessage: (id: number, pinned: boolean) => Promise<void>;
    getSelectedFile: () => WorkspaceFile | null;
    refreshFiles: () => Promise<void>;
    refreshMessages: () => Promise<void>;
    updateFileContent: (id: number, content: string) => Promise<void>;
  };
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

type FileRecord = {
  id: number;
  name: string;
  type: FileKind;
  modifiedAt?: string | null;
  status?: "modified" | "new" | "synced" | null;
  fileType?: string | null;
  content?: string | null;
  parentId: number | null;
  projectId: number;
  ownerType: "team" | "private";
  ownerId?: number | null;
  children?: FileRecord[];
};

// 构建文件树结构
function buildFileTree(files: FileRecord[]): WorkspaceFile[] {
  const fileMap = new Map<number, WorkspaceFile>();
  const rootFiles: WorkspaceFile[] = [];

  // First pass: create all file nodes
  files.forEach((file) => {
    fileMap.set(file.id, {
      id: file.id,
      name: file.name,
      type: file.type,
      modifiedAt: file.modifiedAt,
      status: file.status ?? "synced",
      fileType: (file.fileType as FileType | undefined) ?? undefined,
      content: file.content,
      parentId: file.parentId,
      projectId: file.projectId,
      ownerType: file.ownerType,
      ownerId: file.ownerId,
      children: [],
    });
  });

  // Second pass: build tree structure
  files.forEach((file) => {
    const node = fileMap.get(file.id)!;
    if (file.parentId === null) {
      rootFiles.push(node);
    } else {
      const parent = fileMap.get(file.parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      }
    }
  });

  return rootFiles;
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const PROJECT_ID = 1; // 使用测试项目ID

  const [state, setState] = useState<WorkspaceState>({
    projectId: PROJECT_ID,
    teamFiles: [],
    privateFiles: [],
    selectedFileId: null,
    messages: [],
    globalSearch: "",
    shareDialogOpen: false,
    isLoading: true,
  });

  // 加载文件
  const loadFiles = useCallback(async () => {
    try {
      const [teamFilesData, privateFilesData] = await Promise.all([
        filesApi.getAll({ projectId: PROJECT_ID, ownerType: "team" }) as Promise<FileRecord[]>,
        filesApi.getAll({ projectId: PROJECT_ID, ownerType: "private" }) as Promise<FileRecord[]>,
      ]);

      const teamTree = buildFileTree(teamFilesData);
      const privateTree = buildFileTree(privateFilesData);

      setState((prev) => ({
        ...prev,
        teamFiles: teamTree,
        privateFiles: privateTree,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Failed to load files:", error);
      toast.error("加载文件失败");
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [PROJECT_ID]);

  // 加载消息
  const loadMessages = useCallback(async () => {
    try {
      const messagesData = (await messagesApi.getAll({
        projectId: PROJECT_ID,
        limit: 100,
      })) as Message[];

      setState((prev) => ({
        ...prev,
        messages: messagesData.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
          pinned: msg.pinned,
          quotedMessageId: msg.quotedMessageId,
        })),
      }));
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast.error("加载消息失败");
    }
  }, [PROJECT_ID]);

  // 初始加载
  useEffect(() => {
    loadFiles();
    loadMessages();
  }, [loadFiles, loadMessages]);

  const findFileById = useCallback(
    (files: WorkspaceFile[], id: number): WorkspaceFile | null => {
      for (const file of files) {
        if (file.id === id) return file;
        if (file.children) {
          const found = findFileById(file.children, id);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  const findInState = useCallback(
    (id: number): WorkspaceFile | null =>
      findFileById(state.teamFiles, id) || findFileById(state.privateFiles, id) || null,
    [state.teamFiles, state.privateFiles, findFileById]
  );

  const getSelectedFile = useCallback(() => {
    if (!state.selectedFileId) return null;
    return (
      findInState(state.selectedFileId)
    );
  }, [state.selectedFileId, findInState]);

  const actions = useMemo(
    () => ({
      selectFile: (id: number | null) => {
        setState((prev) => ({ ...prev, selectedFileId: id }));
      },

      renameFile: async (id: number, name: string) => {
        const target = findInState(id);
        if (!target) {
          toast.error("未找到对应文件");
          return;
        }
        if (target.ownerType === "team") {
          toast.error("团队文件为只读，无法重命名");
          return;
        }
        try {
          await filesApi.update(id, { name, status: "modified" });
          await loadFiles();
          toast.success("重命名成功");
        } catch (error) {
          console.error("Failed to rename file:", error);
          toast.error("重命名失败");
        }
      },

      deleteFile: async (id: number) => {
        const target = findInState(id);
        if (!target) {
          toast.error("未找到对应文件");
          return;
        }
        if (target.ownerType === "team") {
          toast.error("团队文件为只读，无法删除");
          return;
        }
        try {
          await filesApi.delete(id);
          await loadFiles();
          setState((prev) => ({
            ...prev,
            selectedFileId: prev.selectedFileId === id ? null : prev.selectedFileId,
          }));
          toast.success("删除成功");
        } catch (error) {
          console.error("Failed to delete file:", error);
          toast.error("删除失败");
        }
      },

      addFile: async (parentId: number | null, file: Partial<WorkspaceFile>) => {
        if (file.ownerType === "team") {
          toast.error("团队文件为只读，无法新建");
          return;
        }
        if (parentId) {
          const parent = findInState(parentId);
          if (parent?.ownerType === "team") {
            toast.error("无法在团队文件夹内新建内容");
            return;
          }
        }
        try {
          const newFile = await filesApi.create({
            projectId: PROJECT_ID,
            name: file.name || "新文件",
            type: file.type || "file",
            ownerType: file.ownerType || "private",
            parentId: parentId || undefined,
            fileType: file.fileType,
            content: file.content,
            status: "new",
          });
          await loadFiles();
          setState((prev) => ({ ...prev, selectedFileId: newFile.id }));
          toast.success("创建成功");
        } catch (error) {
          console.error("Failed to add file:", error);
          toast.error("创建失败");
        }
      },

      moveFile: async (id: number, targetFolderId: number) => {
        const target = findInState(id);
        if (!target) {
          toast.error("未找到对应文件");
          return;
        }
        if (target.ownerType === "team") {
          toast.error("团队文件为只读，无法移动");
          return;
        }
        const destination = findInState(targetFolderId);
        if (!destination || destination.type !== "folder") {
          toast.error("目标文件夹不存在");
          return;
        }
        if (destination.ownerType === "team") {
          toast.error("无法移动到团队文件夹");
          return;
        }
        try {
          await filesApi.update(id, { parentId: targetFolderId });
          await loadFiles();
          toast.success("移动成功");
        } catch (error) {
          console.error("Failed to move file:", error);
          toast.error("移动失败");
        }
      },

      setGlobalSearch: (value: string) => {
        setState((prev) => ({ ...prev, globalSearch: value }));
      },

      setShareDialogOpen: (value: boolean) => {
        setState((prev) => ({ ...prev, shareDialogOpen: value }));
      },

      sendMessage: async (content: string, quotedId: number | null = null) => {
        try {
          // 创建用户消息
          await messagesApi.create({
            projectId: PROJECT_ID,
            role: "user",
            content,
            quotedMessageId: quotedId || undefined,
          });

          // 模拟AI回复
          setTimeout(async () => {
            await messagesApi.create({
              projectId: PROJECT_ID,
              role: "assistant",
              content: "这是来自数据库的AI回复。我已经成功接入PostgreSQL数据库！",
            });
            await loadMessages();
          }, 800);

          await loadMessages();
        } catch (error) {
          console.error("Failed to send message:", error);
          toast.error("发送消息失败");
        }
      },

      pinMessage: async (id: number, pinned: boolean) => {
        try {
          await messagesApi.update(id, { pinned });
          await loadMessages();
          toast.success(pinned ? "已置顶" : "已取消置顶");
        } catch (error) {
          console.error("Failed to pin message:", error);
          toast.error("操作失败");
        }
      },

      getSelectedFile,

      refreshFiles: loadFiles,

      refreshMessages: loadMessages,

      updateFileContent: async (id: number, content: string) => {
        const target = findInState(id);
        if (!target) {
          toast.error("未找到对应文件");
          return;
        }
        if (target.ownerType === "team") {
          toast.error("团队文件为只读，无法保存");
          return;
        }
        try {
          await filesApi.update(id, { content, status: "modified" });
          await loadFiles();
          toast.success("已自动保存");
        } catch (error) {
          console.error("Failed to update file content:", error);
          toast.error("保存失败");
        }
      },
    }),
    [PROJECT_ID, loadFiles, loadMessages, getSelectedFile, findInState]
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
