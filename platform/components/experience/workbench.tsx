"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
export function Workbench({visual,code,explanation,onSwitch}: {visual:ReactNode;code:ReactNode;explanation:ReactNode;onSwitch:()=>void}) {
 const [narrow,setNarrow]=useState(false);
 useEffect(()=>{const query=window.matchMedia('(max-width: 1000px)');setNarrow(query.matches);const change=()=>setNarrow(query.matches);query.addEventListener('change',change);return()=>query.removeEventListener('change',change);},[]);
 if(narrow)return <Tabs defaultValue="visual" className="mobile-workbench" onValueChange={onSwitch}><TabsList className="mobile-stage-tabs"><TabsTrigger value="visual">Visualization</TabsTrigger><TabsTrigger value="code">Code & state</TabsTrigger><TabsTrigger value="explanation">Explanation</TabsTrigger></TabsList><TabsContent value="visual">{visual}</TabsContent><TabsContent value="code">{code}</TabsContent><TabsContent value="explanation">{explanation}</TabsContent></Tabs>;
 return <ResizablePanelGroup orientation="horizontal" className="resizable-workbench"><ResizablePanel defaultSize="63%" minSize="40%">{visual}</ResizablePanel><ResizableHandle withHandle className="studio-resize-handle" aria-label="Resize visualization and code panels"/><ResizablePanel defaultSize="37%" minSize="25%">{code}</ResizablePanel></ResizablePanelGroup>;
}
