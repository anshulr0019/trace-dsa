"use client";
import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Search } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
export function WorkspaceTools({
  onSearch,
  view,
}: {
  onSearch: () => void;
  view: string;
}) {
  const { open, setOpen } = useSidebar();
  const [focus, setFocus] = useState(false);
  const previous = useRef(open);
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;
  useEffect(() => {
    if (!focus) return;
    document.body.classList.add("trace-focus-mode");
    window.dispatchEvent(new Event("trace:focus"));
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocus(false);
    };
    window.addEventListener("keydown", escape);
    const exit = () => setFocus(false);
    window.addEventListener("trace:exit-focus", exit);
    return () => {
      document.body.classList.remove("trace-focus-mode");
      window.dispatchEvent(new Event("trace:unfocus"));
      setOpenRef.current(previous.current);
      window.removeEventListener("keydown", escape);
      window.removeEventListener("trace:exit-focus", exit);
    };
  }, [focus]);
  useEffect(() => {
    setFocus(false);
  }, [view]);
  return (
    <>
      <button
        className="workspace-search-button"
        onClick={onSearch}
        aria-label="Find a lesson or workspace"
      >
        <Search size={15} />
        <span>Find anything</span>
        <kbd>⌘ / Ctrl K</kbd>
      </button>
      <button
        className="workspace-focus-button"
        aria-pressed={focus}
        onClick={() => {
          if (!focus) {
            previous.current = open;
            setOpen(false);
          }
          setFocus((v) => !v);
        }}
      >
        {focus ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        <span>{focus ? "Exit focus" : "Focus mode"}</span>
      </button>
    </>
  );
}
