"use client";
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { usePlayback } from "./use-playback";

export function PlaybackDock({
  playback,
  count,
  speed,
  setSpeed,
  running,
  onSeek,
}: {
  playback: ReturnType<typeof usePlayback>;
  count: number;
  speed: string;
  setSpeed: (v: string) => void;
  running: boolean;
  onSeek: (v: number) => void;
}) {
  const moving = playback.playing || playback.active;
  return (
    <div
      className="inline-playback"
      role="region"
      aria-label="Playback controls"
    >
      <div className="dock-transport">
        <button
          className="icon-button"
          onClick={() => onSeek(0)}
          aria-label="Reset playback"
          disabled={running || (playback.step === 0 && playback.target === 0)}
        >
          <RotateCcw size={16} />
        </button>
        <button
          className="icon-button"
          aria-label="Previous step"
          disabled={running || playback.step === 0}
          onClick={() => playback.move(playback.step - 1)}
        >
          <SkipBack size={17} />
        </button>
        <button
          className="dock-play"
          aria-label={moving ? "Pause" : "Play"}
          disabled={running || count < 2}
          onClick={() => playback.setPlaying(!moving)}
        >
          {moving ? <Pause size={18} /> : <Play size={18} />}
          <span>{moving ? "Pause" : "Play"}</span>
        </button>
        <button
          className="icon-button"
          aria-label="Next step"
          disabled={running || playback.step >= count - 1}
          onClick={() => playback.move(playback.step + 1)}
        >
          <SkipForward size={17} />
        </button>
      </div>
      <div className="dock-timeline">
        <div>
          <span>EXECUTION</span>
          <span>
            <b>{playback.step}</b> / {Math.max(0, count - 1)}
          </span>
        </div>
        <Slider
          aria-label="Execution step"
          min={0}
          max={Math.max(1, count - 1)}
          step={1}
          value={[playback.step]}
          disabled={running || count < 2}
          onValueChange={([n]) => onSeek(n)}
        />
      </div>
      <Select value={speed} onValueChange={setSpeed}>
        <SelectTrigger aria-label="Playback speed" className="dock-speed">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {["0.5", "1", "1.5", "2", "4"].map((v) => (
            <SelectItem value={v} key={v}>
              {v}× speed
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
