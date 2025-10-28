"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import TopNavBar from "./TopNavBar";
import ChatPanel from "./ChatPanel";
import FileBrowser from "./FileBrowser";
import EditorArea from "./EditorArea";
import { WorkspaceProvider } from "@/hooks/useWorkspaceStore";

export default function WorkspaceLayout() {
  return (
    <WorkspaceProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
        {/* Top Navigation */}
        <TopNavBar />

        {/* Main Content with Resizable Panels */}
        <div className="flex-1 overflow-hidden">
          <PanelGroup direction="horizontal">
            {/* Left: Chat Panel */}
            <Panel defaultSize={20} minSize={15} maxSize={30}>
              <ChatPanel />
            </Panel>

            <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

            {/* Middle: File Browser */}
            <Panel defaultSize={20} minSize={15} maxSize={30}>
              <FileBrowser />
            </Panel>

            <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

            {/* Right: Editor Area */}
            <Panel defaultSize={60} minSize={40}>
              <EditorArea />
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </WorkspaceProvider>
  );
}