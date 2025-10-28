"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  Upload,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link,
  Table,
  Type,
  Palette,
  Printer,
  Search,
  FileText,
  Subscript,
  Superscript,
  Heading1,
  Heading2,
  Heading3,
  ChevronDown,
  MoreHorizontal,
  Paintbrush,
  FileCode,
  Calendar,
  CheckSquare,
  Indent,
  Outdent,
  Code,
  Droplets,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface DocxEditorProps {
  onWordCountUpdate?: (count: number) => void;
  onPageCountUpdate?: (count: number) => void;
  zoom?: number;
  readOnly?: boolean;
}

type CanvasEditorElement = {
  type: string;
  value?: string;
  width?: number;
  height?: number;
};

type CanvasEditorRange = {
  startIndex: number;
  endIndex: number;
};

interface CanvasEditorCommand extends Record<string, unknown> {
  executePageScale(scale: number): void;
  executeExportDocx(): void;
  executeImportDocx(buffer: ArrayBuffer): void;
  executePrint(): void;
  executeInsertElementList(elements: CanvasEditorElement[]): void;
  executeHyperlink(payload: { type: string; url: string }): void;
  executeInsertTable(payload: { row: number; col: number }): void;
  executeSearch(): void;
  executePainter(): void;
  executeIncreaseIndent(): void;
  executeDecreaseIndent(): void;
  executeWatermark(payload: { data: string; color: string; size: number; opacity: number }): void;
  getValue(): { data: { main: Array<{ value?: string }> } };
  getPageNo?: () => Array<unknown>;
}

interface CanvasEditorRangeManager {
  getRange(): CanvasEditorRange | null;
}

interface CanvasEditorInstance {
  getCommand(): CanvasEditorCommand;
  getRange(): CanvasEditorRangeManager;
  destroy?: () => void;
}

type CanvasEditorConstructor = new (
  container: HTMLElement,
  initialData?: unknown[]
) => CanvasEditorInstance;

export default function DocxEditor({
  onWordCountUpdate,
  onPageCountUpdate,
  zoom = 100,
  readOnly = false,
}: DocxEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<CanvasEditorInstance | null>(null);
  const intervalIdRef = useRef<number | null>(null);
  const [currentFontSize, setCurrentFontSize] = useState(16);
  const [currentFontFamily, setCurrentFontFamily] = useState("微软雅黑");
  const [isFormatBrushActive, setIsFormatBrushActive] = useState(false);

  // Dialog states (replace browser prompts)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [watermarkDialogOpen, setWatermarkDialogOpen] = useState(false);
  const [watermarkText, setWatermarkText] = useState("机密文档");

  useEffect(() => {
    const initEditor = async () => {
      if (typeof window === "undefined" || !editorContainerRef.current) return;

      try {
        const Editor = (await import("@hufe921/canvas-editor")).default as CanvasEditorConstructor;

        const instance = new Editor(
          editorContainerRef.current,
          [
            {
              value: "欢迎使用 Canvas Editor 文档编辑器",
              size: 26,
              bold: true,
            },
            {
              value: "\n\n",
            },
            {
              value: "这是一个功能完整的文档编辑器，基于 Canvas 实现，支持 Word 级别的富文本编辑。",
              size: 16,
            },
            {
              value: "\n\n",
            },
            {
              value: "【核心功能】",
              size: 18,
              bold: true,
            },
            {
              value: "\n",
            },
            {
              value: "✓ 完整工具栏：字体、字号、加粗、斜体、下划线、颜色、对齐等",
              size: 14,
            },
            {
              value: "\n",
            },
            {
              value: "✓ 右键菜单：支持剪切、复制、粘贴、表格、图片、链接等上下文操作",
              size: 14,
            },
            {
              value: "\n",
            },
            {
              value: "✓ 段落格式：列表、缩进、行距、段落间距",
              size: 14,
            },
            {
              value: "\n",
            },
            {
              value: "✓ 插入元素：表格、图片、链接、分页符、水印、日期、复选框",
              size: 14,
            },
            {
              value: "\n",
            },
            {
              value: "✓ 高级功能：格式刷、查找替换、页眉页脚、打印预览",
              size: 14,
            },
            {
              value: "\n",
            },
            {
              value: "✓ DOCX 导入导出：支持完整的文档导入导出",
              size: 14,
            },
            {
              value: "\n\n",
            },
            {
              value: "【使用提示】",
              size: 18,
              bold: true,
            },
            {
              value: "\n",
            },
            {
              value: "• 使用顶部工具栏快速格式化文档",
              size: 14,
              color: "#666666",
            },
            {
              value: "\n",
            },
            {
              value: "• 右键点击可打开上下文菜单",
              size: 14,
              color: "#666666",
            },
            {
              value: "\n",
            },
            {
              value: "• 支持 Ctrl+Z/Ctrl+Y 撤销重做",
              size: 14,
              color: "#666666",
            },
            {
              value: "\n",
            },
            {
              value: "• Ctrl+B/I/U 分别对应加粗、斜体、下划线",
              size: 14,
              color: "#666666",
            },
            {
              value: "\n",
            },
            {
              value: "• Ctrl+F 打开查找替换功能",
              size: 14,
              color: "#666666",
            },
          ],
          {
            height: 800,
            width: 794,
            pageMode: "continuous",
            pageNumber: {
              format: "第 {pageNo} 页 / 共 {pageCount} 页",
            },
            paperDirection: "vertical",
            minSize: 1,
            maxSize: 72,
            defaultSize: 16,
            defaultRowMargin: 1,
            defaultBasicRowMarginHeight: 8,
            defaultTabWidth: 32,
            header: {
              disabled: false,
              bottom: 5,
              height: 50,
              top: 30,
            },
            footer: {
              disabled: false,
              bottom: 30,
              height: 50,
              top: 5,
            },
            pageGap: 20,
            historyMaxRecordCount: 100,
            wordBreak: "break-all",
            zone: {
              tipDisabled: false,
            },
            contextMenu: {
              global: {
                disabled: false,
                items: [
                  "undo",
                  "redo",
                  "|",
                  "cut",
                  "copy",
                  "paste",
                  "selectAll",
                  "|",
                  "print",
                  "searchAndReplace",
                  "|",
                  "image",
                  "hyperlink",
                  "table",
                  "|",
                  "paragraph",
                  "control",
                ],
              },
            },
            margins: [100, 120, 100, 120],
          }
        );

        editorInstanceRef.current = instance;

        // 监听内容变化
        const updateStats = () => {
          try {
            const command = instance.getCommand();
            const value = command.getValue();
            const mainContent = value.data.main as Array<{ value?: string }>;
            const text = mainContent
              .map((item) => item.value ?? "")
              .join("");
            if (onWordCountUpdate) {
              onWordCountUpdate(text.length);
            }
            if (onPageCountUpdate) {
              try {
                const pageNo = command.getPageNo?.();
                if (Array.isArray(pageNo)) {
                  onPageCountUpdate(pageNo.length || 1);
                }
              } catch {
                // ignore
              }
            }
          } catch {
            // ignore update errors
          }
        };

        // 立即更新一次
        updateStats();
        // 定时更新
        intervalIdRef.current = window.setInterval(updateStats, 1000);
      } catch (error) {
        console.error("Failed to initialize editor:", error);
        toast.error("编辑器初始化失败");
      }
    };

    initEditor();

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      try {
        editorInstanceRef.current?.destroy?.();
      } catch {}
      editorInstanceRef.current = null;
    };
  }, [onWordCountUpdate, onPageCountUpdate]);

  // 处理缩放
  useEffect(() => {
    if (editorInstanceRef.current && zoom) {
      try {
        const command = editorInstanceRef.current.getCommand();
        const scale = zoom / 100;
        command.executePageScale(scale);
      } catch {
        // ignore
      }
    }
  }, [zoom]);

  // 执行命令的通用方法
  const executeCommand = (commandName: string, payload?: unknown) => {
    if (!editorInstanceRef.current) {
      toast.error("编辑器未初始化");
      return;
    }
    try {
      const command = editorInstanceRef.current.getCommand();
      const methodName = `execute${commandName.charAt(0).toUpperCase() + commandName.slice(1)}`;
      const handler = command[methodName];
      if (typeof handler === "function") {
        (handler as (value?: unknown) => unknown)(payload);
        toast.success(`执行${commandName}成功`);
      } else {
        console.warn(`Command ${methodName} not found`);
      }
    } catch (error) {
      console.error(`Failed to execute ${commandName}:`, error);
      toast.error(`执行${commandName}失败`);
    }
  };

  // 文件操作
  const handleExport = () => {
    if (editorInstanceRef.current) {
      try {
        const command = editorInstanceRef.current.getCommand();
        command.executeExportDocx();
        toast.success("开始导出 DOCX 文档");
      } catch (error) {
        console.error("Failed to export:", error);
        toast.error("导出失败");
      }
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".docx";
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (file && editorInstanceRef.current) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const command = editorInstanceRef.current.getCommand();
          command.executeImportDocx(arrayBuffer);
          toast.success("文档导入成功");
        } catch (error) {
          console.error("Failed to import:", error);
          toast.error("导入失败");
        }
      }
    };
    input.click();
  };

  const handlePrint = () => {
    if (editorInstanceRef.current) {
      try {
        const command = editorInstanceRef.current.getCommand();
        command.executePrint();
        toast.success("打开打印预览");
      } catch (error) {
        console.error("Failed to print:", error);
        toast.error("打印失败");
      }
    }
  };

  // 插入操作
  const handleInsertImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (file && editorInstanceRef.current) {
        try {
          const reader = new FileReader();
          reader.onload = (loadEvent: ProgressEvent<FileReader>) => {
            const result = loadEvent.target?.result;
            if (typeof result === "string") {
              const command = editorInstanceRef.current?.getCommand();
              command?.executeInsertElementList([
                {
                  type: "image",
                  value: result,
                  width: 200,
                  height: 200,
                },
              ]);
              toast.success("图片插入成功");
            } else {
              toast.error("不支持的图片格式");
            }
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error("Failed to insert image:", error);
          toast.error("插入图片失败");
        }
      }
    };
    input.click();
  };

  const tryOpenLinkDialog = () => {
    if (!editorInstanceRef.current) return;
    try {
      const rangeManager = editorInstanceRef.current.getRange();
      const range = rangeManager.getRange();
      if (!range || range.startIndex === range.endIndex) {
        toast.warning("请先选择要添加链接的文本");
        return;
      }
      setLinkDialogOpen(true);
    } catch {
      toast.error("无法打开链接对话框");
    }
  };

  const confirmInsertLink = () => {
    if (!editorInstanceRef.current) return;
    try {
      const command = editorInstanceRef.current.getCommand();
      command.executeHyperlink({
        type: "hyperlink",
        url: linkUrl,
      });
      toast.success("链接添加成功");
      setLinkDialogOpen(false);
    } catch {
      toast.error("添加链接失败");
    }
  };

  const handleInsertTable = (rows: number = 3, cols: number = 3) => {
    if (editorInstanceRef.current) {
      try {
        const command = editorInstanceRef.current.getCommand();
        command.executeInsertTable({
          row: rows,
          col: cols,
        });
        toast.success(`插入 ${rows}x${cols} 表格成功`);
      } catch (error) {
        console.error("Failed to insert table:", error);
        toast.error("插入表格失败");
      }
    }
  };

  const handleSearch = () => {
    if (editorInstanceRef.current) {
      try {
        const command = editorInstanceRef.current.getCommand();
        command.executeSearch();
        toast.success("打开查找功能");
      } catch (error) {
        console.error("Failed to search:", error);
        toast.error("打开查找功能失败");
      }
    }
  };

  // 格式化操作
  const handleSetFontSize = (size: number) => {
    setCurrentFontSize(size);
    executeCommand("size", size);
  };

  const handleSetFontFamily = (family: string) => {
    setCurrentFontFamily(family);
    executeCommand("font", family);
  };

  const handleSetColor = (color: string) => {
    executeCommand("color", color);
  };

  const handleSetBackgroundColor = (color: string) => {
    executeCommand("highlight", color);
  };

  // 对齐方式
  const handleAlign = (align: "left" | "center" | "right" | "justify") => {
    executeCommand("rowFlex", align === "justify" ? "alignment" : align);
  };

  // 列表
  const handleList = (type: "ul" | "ol") => {
    executeCommand("list", type);
  };

  // 标题
  const handleTitle = (level: number | null) => {
    executeCommand("title", level);
  };

  // 上下标
  const handleSuperscript = () => {
    executeCommand("superscript");
  };

  const handleSubscript = () => {
    executeCommand("subscript");
  };

  // 格式刷
  const handleFormatBrush = () => {
    if (editorInstanceRef.current) {
      try {
        const command = editorInstanceRef.current.getCommand();
        command.executePainter();
        setIsFormatBrushActive(!isFormatBrushActive);
        toast.success(isFormatBrushActive ? "关闭格式刷" : "开启格式刷");
      } catch (error) {
        console.error("Failed to toggle format brush:", error);
        toast.error("格式刷切换失败");
      }
    }
  };

  // 缩进
  const handleIndent = (type: "increase" | "decrease") => {
    if (editorInstanceRef.current) {
      try {
        const command = editorInstanceRef.current.getCommand();
        if (type === "increase") {
          command.executeIncreaseIndent();
          toast.success("增加缩进");
        } else {
          command.executeDecreaseIndent();
          toast.success("减少缩进");
        }
      } catch (error) {
        console.error("Failed to change indent:", error);
        toast.error("缩进调整失败");
      }
    }
  };

  // 插入分页符
  const handleInsertPageBreak = () => {
    if (editorInstanceRef.current) {
      try {
        const command = editorInstanceRef.current.getCommand();
        command.executeInsertElementList([
          {
            type: "pageBreak",
          },
        ]);
        toast.success("插入分页符成功");
      } catch (error) {
        console.error("Failed to insert page break:", error);
        toast.error("插入分页符失败");
      }
    }
  };

  // 水印
  const openWatermarkDialog = () => {
    setWatermarkDialogOpen(true);
  };

  const confirmWatermark = () => {
    if (editorInstanceRef.current) {
      try {
        const command = editorInstanceRef.current.getCommand();
        command.executeWatermark({
          data: watermarkText,
          color: "#CCCCCC",
          size: 200,
          opacity: 0.3,
        });
        toast.success("添加水印成功");
        setWatermarkDialogOpen(false);
      } catch (error) {
        console.error("Failed to add watermark:", error);
        toast.error("添加水印失败");
      }
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* 完整工具栏 */}
      <div className="border-b border-border bg-background">
        <TooltipProvider>
          <div className="h-auto p-2 flex flex-wrap items-center gap-1">
            {/* 文件操作 */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={handleImport}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    <span className="text-xs">导入</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>从本地导入 DOCX 文档</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={handleExport}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    <span className="text-xs">导出</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>导出为 DOCX 文档</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={handlePrint}
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    <span className="text-xs">打印</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>打印文档</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* 撤销重做 */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => executeCommand("undo")}
                  >
                    <Undo className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>撤销 (Ctrl+Z)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => executeCommand("redo")}
                  >
                    <Redo className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>重做 (Ctrl+Y)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isFormatBrushActive ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleFormatBrush}
                  >
                    <Paintbrush className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>格式刷</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* 字体和字号 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 min-w-[100px]">
                  <Type className="w-4 h-4" />
                  <span className="text-xs truncate">{currentFontFamily}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleSetFontFamily("微软雅黑")}>
                  微软雅黑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSetFontFamily("宋体")}>
                  宋体
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSetFontFamily("黑体")}>
                  黑体
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSetFontFamily("楷体")}>
                  楷体
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSetFontFamily("仿宋")}>
                  仿宋
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSetFontFamily("Arial")}>
                  Arial
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSetFontFamily("Times New Roman")}>
                  Times New Roman
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1 w-[70px]">
                  <span className="text-xs">{currentFontSize}</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 72].map((size) => (
                  <DropdownMenuItem key={size} onClick={() => handleSetFontSize(size)}>
                    {size}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6" />

            {/* 文本格式 */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => executeCommand("bold")}
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>粗体 (Ctrl+B)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => executeCommand("italic")}
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>斜体 (Ctrl+I)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => executeCommand("underline")}
                  >
                    <Underline className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>下划线 (Ctrl+U)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => executeCommand("strikeout")}
                  >
                    <Strikethrough className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>删除线</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleSuperscript}
                  >
                    <Superscript className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>上标</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleSubscript}
                  >
                    <Subscript className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>下标</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* 颜色 */}
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Palette className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>文字颜色</TooltipContent>
                  </Tooltip>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <div className="p-2">
                    <p className="text-xs font-medium mb-2">文字颜色</p>
                    <div className="grid grid-cols-8 gap-1">
                      {[
                        "#000000", "#FF0000", "#00FF00", "#0000FF",
                        "#FFFF00", "#FF00FF", "#00FFFF", "#FFFFFF",
                        "#808080", "#800000", "#008000", "#000080",
                        "#808000", "#800080", "#008080", "#C0C0C0",
                      ].map((color) => (
                        <button
                          key={color}
                          className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => handleSetColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Droplets className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>背景颜色</TooltipContent>
                  </Tooltip>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <div className="p-2">
                    <p className="text-xs font-medium mb-2">背景颜色</p>
                    <div className="grid grid-cols-8 gap-1">
                      {[
                        "transparent", "#FFFF00", "#00FF00", "#00FFFF",
                        "#FF00FF", "#0000FF", "#FF0000", "#000000",
                        "#F0F0F0", "#FFFFCC", "#CCFFCC", "#CCFFFF",
                        "#FFCCFF", "#CCCCFF", "#FFCCCC", "#808080",
                      ].map((color) => (
                        <button
                          key={color}
                          className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                          style={{ backgroundColor: color === "transparent" ? "white" : color }}
                          onClick={() => handleSetBackgroundColor(color)}
                        >
                          {color === "transparent" && <span className="text-xs">无</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* 对齐 */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleAlign("left")}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>左对齐</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleAlign("center")}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>居中对齐</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleAlign("right")}
                  >
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>右对齐</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleAlign("justify")}
                  >
                    <AlignJustify className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>两端对齐</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* 列表和缩进 */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleList("ul")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>无序列表</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleList("ol")}
                  >
                    <ListOrdered className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>有序列表</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleIndent("decrease")}
                  >
                    <Outdent className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>减少缩进</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleIndent("increase")}
                  >
                    <Indent className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>增加缩进</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* 标题 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">标题</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleTitle(1)}>
                  <Heading1 className="w-4 h-4 mr-2" />
                  一级标题
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTitle(2)}>
                  <Heading2 className="w-4 h-4 mr-2" />
                  二级标题
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTitle(3)}>
                  <Heading3 className="w-4 h-4 mr-2" />
                  三级标题
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleTitle(null)}>
                  正文
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6" />

            {/* 插入 */}
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Table className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>插入表格</TooltipContent>
                  </Tooltip>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleInsertTable(2, 2)}>
                    2x2 表格
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleInsertTable(3, 3)}>
                    3x3 表格
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleInsertTable(4, 4)}>
                    4x4 表格
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleInsertTable(5, 5)}>
                    5x5 表格
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleInsertImage}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>插入图片</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={tryOpenLinkDialog}
                  >
                    <Link className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>插入链接</TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>更多插入选项</TooltipContent>
                  </Tooltip>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleInsertPageBreak}>
                    <FileCode className="w-4 h-4 mr-2" />
                    分页符
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={openWatermarkDialog}>
                    <Droplets className="w-4 h-4 mr-2" />
                    水印
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => toast.info("日期选择器功能")}> 
                    <Calendar className="w-4 h-4 mr-2" />
                    日期选择器
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("复选框功能")}>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    复选框
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("代码块功能")}>
                    <Code className="w-4 h-4 mr-2" />
                    代码块
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* 搜索 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSearch}
                >
                  <Search className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>查找和替换 (Ctrl+F)</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* 链接对话框 */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>插入链接</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">请输入链接地址</div>
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://" />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setLinkDialogOpen(false)}>取消</Button>
            <Button onClick={confirmInsertLink}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 水印对话框 */}
      <Dialog open={watermarkDialogOpen} onOpenChange={setWatermarkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加水印</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">水印文字</div>
            <Input value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setWatermarkDialogOpen(false)}>取消</Button>
            <Button onClick={confirmWatermark}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Canvas Editor 容器 */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="w-full h-full flex items-start justify-center py-4">
          <div ref={editorContainerRef} className="shadow-lg" />
        </div>
      </div>
      {readOnly && (
        <div className="absolute inset-0 z-30 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center text-sm text-muted-foreground">
          <div className="px-4 py-2 rounded-md border border-dashed border-muted-foreground/60 bg-background/80">
            团队文件为只读，无法在此编辑
          </div>
        </div>
      )}
    </div>
  );
}
