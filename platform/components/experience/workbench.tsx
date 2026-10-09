"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
export function Workbench({
  visual,
  code,
  explanation,
  onSwitch,
  focusRequest = 0,
  codeRequest = 0,
  visualSize = 63,
}: {
  visual: ReactNode;
  code: ReactNode;
  explanation: ReactNode;
  onSwitch: () => void;
  focusRequest?: number;
  codeRequest?: number;
  visualSize?: number;
}) {
  const [narrow, setNarrow] = useState(false),
    [tab, setTab] = useState("visual");
  useEffect(() => {
    if (focusRequest) setTab("visual");
  }, [focusRequest]);
  useEffect(() => {
    if (codeRequest) setTab("code");
  }, [codeRequest]);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1000px)");
    setNarrow(query.matches);
    const change = () => setNarrow(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  if (narrow)
    return (
      <Tabs
        value={tab}
        className="mobile-workbench"
        onValueChange={(value) => {
          setTab(value);
          onSwitch();
        }}
      >
        <TabsList className="mobile-stage-tabs">
          <TabsTrigger value="visual">Visualization</TabsTrigger>
          <TabsTrigger value="code">Code & state</TabsTrigger>
          <TabsTrigger value="explanation">Explanation</TabsTrigger>
        </TabsList>
        <TabsContent value="visual">{visual}</TabsContent>
        <TabsContent value="code">{code}</TabsContent>
        <TabsContent value="explanation">{explanation}</TabsContent>
      </Tabs>
    );
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="resizable-workbench"
    >
      <ResizablePanel defaultSize={`${visualSize}%`} minSize="40%">
        {visual}
      </ResizablePanel>
      <ResizableHandle
        withHandle
        className="studio-resize-handle"
        aria-label="Resize visualization and code panels"
      />
      <ResizablePanel defaultSize={`${100 - visualSize}%`} minSize="25%">
        {code}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
