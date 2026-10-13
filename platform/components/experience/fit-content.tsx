"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Preserve diagram coordinates while fitting the complete drawing to its panel. */
export function FitContent({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const outer = host.current,
      inner = content.current;
    if (!outer || !inner) return;
    const update = () => {
      const width = inner.scrollWidth;
      setScale(
        width > 0
          ? Math.min(
              1,
              (outer.clientWidth -
                parseFloat(getComputedStyle(outer).paddingLeft) -
                parseFloat(getComputedStyle(outer).paddingRight)) /
                width,
            )
          : 1,
      );
    };
    const observer = new ResizeObserver(update);
    observer.observe(outer);
    observer.observe(inner);
    update();
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={host} className={`fit-content ${className}`}>
      <div ref={content} className="fit-content-inner" style={{ zoom: scale }}>
        {children}
      </div>
    </div>
  );
}
