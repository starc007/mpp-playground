"use client";

import { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import type { LightDark } from "@/lib/html-builder-types";

interface ColorPickerFieldProps {
  label: string;
  description: string;
  value: LightDark;
  onChange: (value: LightDark) => void;
}

export function ColorPickerField({
  label,
  description,
  value,
  onChange,
}: ColorPickerFieldProps) {
  const [mode, setMode] = useState<"light" | "dark">("dark");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentColor = mode === "light" ? value[0] : value[1];

  function handleChange(color: string) {
    if (mode === "light") {
      onChange([color, value[1]]);
    } else {
      onChange([value[0], color]);
    }
  }

  // Close picker on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="space-y-1.5" ref={ref}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-medium">{label}</span>
          <span className="text-[10px] text-muted-foreground ml-2">
            {description}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode("light")}
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              mode === "light"
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground"
            }`}
          >
            L
          </button>
          <button
            onClick={() => setMode("dark")}
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              mode === "dark"
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground"
            }`}
          >
            D
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded-md border border-border shrink-0 cursor-pointer"
          style={{ backgroundColor: currentColor }}
          title={currentColor}
        />
        <input
          type="text"
          value={currentColor}
          onChange={(e) => handleChange(e.target.value)}
          className="flex-1 h-8 px-2 rounded-md border border-border bg-transparent text-xs font-mono focus:outline-none focus:border-border-active"
        />
      </div>

      {open && (
        <div className="relative z-50">
          <div className="absolute top-1 left-0 p-3 rounded-lg border border-border bg-card shadow-lg">
            <HexColorPicker color={currentColor} onChange={handleChange} />
          </div>
        </div>
      )}
    </div>
  );
}
