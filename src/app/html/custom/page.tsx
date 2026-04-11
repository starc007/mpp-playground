"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Copy,
  Check,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Type,
  MousePointerClick,
  Image,
  BoxSelect,
  Minus,
  Space,
  LayoutTemplate,
  Code2,
  Sparkles,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type BuilderElement,
  type ElementType,
  type ButtonProps,
  type TextProps,
  type ImageProps,
  type ContainerProps,
  type DividerProps,
  type SpacerProps,
  type ElementStyle,
  createButton,
  createText,
  createImage,
  createContainer,
  createDivider,
  createSpacer,
  generateScript,
  TEMPLATES,
} from "@/lib/custom-script-types";

const ELEMENT_ICONS: Record<ElementType, React.ReactNode> = {
  button: <MousePointerClick className="size-3.5" />,
  text: <Type className="size-3.5" />,
  image: <Image className="size-3.5" />,
  container: <BoxSelect className="size-3.5" />,
  divider: <Minus className="size-3.5" />,
  spacer: <Space className="size-3.5" />,
};

const ELEMENT_LABELS: Record<ElementType, string> = {
  button: "Button",
  text: "Text",
  image: "Image",
  container: "Container",
  divider: "Divider",
  spacer: "Spacer",
};

const ELEMENT_DESCRIPTIONS: Record<ElementType, string> = {
  button: "Clickable action",
  text: "Paragraph or heading",
  image: "Logo or graphic",
  container: "Group with border",
  divider: "Horizontal line",
  spacer: "Vertical gap",
};

const ADD_ELEMENTS: { type: ElementType; create: () => BuilderElement }[] = [
  { type: "button", create: () => createButton({ isPrimary: false }) },
  { type: "text", create: createText },
  { type: "image", create: createImage },
  { type: "container", create: createContainer },
  { type: "divider", create: createDivider },
  { type: "spacer", create: createSpacer },
];

export default function CustomScriptPage() {
  const [elements, setElements] = useState<BuilderElement[]>(
    () => TEMPLATES[0]!.elements(),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [showScript, setShowScript] = useState(false);

  const script = useMemo(() => generateScript(elements), [elements]);

  const selected = elements.find((e) => e.id === selectedId) ?? null;

  const previewUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const scriptB64 = btoa(unescape(encodeURIComponent(script)));
    const params = new URLSearchParams();
    params.set("script", scriptB64);
    return `/api/html-preview/custom?${params.toString()}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script, previewKey]);

  function refreshPreview() {
    setPreviewKey((k) => k + 1);
  }

  function applyTemplate(name: string) {
    const t = TEMPLATES.find((t) => t.name === name);
    if (t) {
      setElements(t.elements());
      setSelectedId(null);
    }
  }

  function addElement(create: () => BuilderElement) {
    const el = create();
    setElements((prev) => [...prev, el]);
    setSelectedId(el.id);
  }

  function removeElement(id: string) {
    setElements((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function moveElement(id: string, dir: -1 | 1) {
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target]!, next[idx]!];
      return next;
    });
  }

  const updateProps = useCallback(
    (id: string, updates: Record<string, unknown>) => {
      setElements((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, props: { ...e.props, ...updates } } : e,
        ),
      );
    },
    [],
  );

  const updateStyle = useCallback(
    (id: string, updates: Partial<ElementStyle>) => {
      setElements((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, style: { ...e.style, ...updates } } : e,
        ),
      );
    },
    [],
  );

  async function handleCopy() {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DashboardLayout
      title="Custom Script Builder"
      description="Build a custom payment UI visually. Pick elements, style them, and get the Html.init script."
    >
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
        {/* ─── Left: Controls ─── */}
        <div className="space-y-5">
          {/* Template picker — horizontal cards */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <LayoutTemplate className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Templates
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => applyTemplate(t.name)}
                  className="group relative flex flex-col items-start gap-0.5 rounded-xl border border-border bg-card p-3 text-left transition-all hover:border-foreground/20 hover:shadow-sm active:scale-[0.98]"
                >
                  <span className="text-xs font-medium">{t.name}</span>
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    {t.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Element list */}
          <Card className="overflow-visible">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Elements</CardTitle>
              <AddElementMenu onAdd={addElement} />
            </CardHeader>
            <CardContent>
              {elements.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <Sparkles className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No elements yet.
                    <br />
                    Add one above or pick a template.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {elements.map((el, idx) => (
                    <motion.div
                      key={el.id}
                      layout
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => setSelectedId(el.id)}
                      className={`group/item flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-xs ${
                        selectedId === el.id
                          ? "bg-primary/8 ring-1 ring-primary/20"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <GripVertical className="size-3 text-muted-foreground/50 shrink-0" />
                      <div
                        className={`flex items-center justify-center size-6 rounded-lg shrink-0 ${
                          selectedId === el.id
                            ? "bg-primary/10 text-primary"
                            : "bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        {ELEMENT_ICONS[el.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">
                          {elementLabel(el)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {ELEMENT_LABELS[el.type]}
                          {el.type === "button" &&
                            (el.props as ButtonProps).isPrimary &&
                            " · Pay action"}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveElement(el.id, -1);
                          }}
                          disabled={idx === 0}
                          className="p-1 rounded-lg hover:bg-background disabled:opacity-20 transition-colors"
                        >
                          <ChevronUp className="size-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveElement(el.id, 1);
                          }}
                          disabled={idx === elements.length - 1}
                          className="p-1 rounded-lg hover:bg-background disabled:opacity-20 transition-colors"
                        >
                          <ChevronDown className="size-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeElement(el.id);
                          }}
                          className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Properties panel */}
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center size-6 rounded-lg bg-primary/10 text-primary">
                        {ELEMENT_ICONS[selected.type]}
                      </div>
                      <CardTitle className="text-sm font-medium">
                        {ELEMENT_LABELS[selected.type]}
                      </CardTitle>
                    </div>
                    <button
                      onClick={() => setSelectedId(null)}
                      className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <TypeSpecificProps
                      element={selected}
                      updateProps={(u) => updateProps(selected.id, u)}
                    />
                    {selected.type !== "divider" &&
                      selected.type !== "spacer" && (
                        <div className="border-t border-border pt-4">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-3">
                            Style
                          </p>
                          <StyleProps
                            style={selected.style}
                            onChange={(u) => updateStyle(selected.id, u)}
                            showText={
                              selected.type !== "image" &&
                              selected.type !== "container"
                            }
                          />
                        </div>
                      )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Right: Preview + Script ─── */}
        <div className="space-y-5 xl:sticky xl:top-6">
          {/* Live preview */}
          <Card className="overflow-hidden p-0 gap-0">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="size-2 rounded-full bg-red-400/80" />
                  <span className="size-2 rounded-full bg-yellow-400/80" />
                  <span className="size-2 rounded-full bg-green-400/80" />
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Preview
                </span>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded-md hover:bg-muted/50"
                >
                  open ↗
                </a>
              </div>
            </div>
            <div className="relative bg-neutral-50 dark:bg-neutral-950 h-[400px]">
              {previewUrl && (
                <iframe
                  key={previewUrl}
                  src={previewUrl}
                  className="w-full h-full"
                  title="Custom script preview"
                />
              )}
            </div>
          </Card>

          {/* Script output — collapsible */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <button
                onClick={() => setShowScript(!showScript)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Code2 className="size-3.5 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">
                  Generated Script
                </CardTitle>
                <ChevronDown
                  className={`size-3 text-muted-foreground transition-transform ${showScript ? "rotate-180" : ""}`}
                />
              </button>
              <Button variant="outline" size="xs" onClick={handleCopy}>
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? "copied" : "copy"}
              </Button>
            </CardHeader>
            <AnimatePresence initial={false}>
              {showScript && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <CardContent>
                    <pre className="text-[11px] font-mono leading-relaxed whitespace-pre-wrap overflow-auto max-h-80 p-4 rounded-xl border border-border bg-muted/30">
                      {script}
                    </pre>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Usage hint */}
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Use the generated script as custom HTML content:
            </p>
            <code className="block text-[11px] font-mono mt-1.5 text-foreground/70">
              tempo.charge({"{"} html: {"{"} content: `&lt;script&gt;$
              {"{"}script{"}"}&lt;/script&gt;` {"}"} {"}"})
            </code>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ── Sub-components ──

function AddElementMenu({
  onAdd,
}: {
  onAdd: (create: () => BuilderElement) => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <Button variant="outline" size="xs" onClick={() => setOpen(!open)}>
        <Plus className="size-3" />
        Add element
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1.5 z-20 bg-card border border-border rounded-xl shadow-lg p-1.5 min-w-48"
          >
            {ADD_ELEMENTS.map((item) => (
              <button
                key={item.type}
                onClick={() => {
                  onAdd(item.create);
                  setOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2 text-xs rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-center size-7 rounded-lg bg-muted/50 text-muted-foreground">
                  {ELEMENT_ICONS[item.type]}
                </div>
                <div className="text-left">
                  <p className="font-medium">{ELEMENT_LABELS[item.type]}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {ELEMENT_DESCRIPTIONS[item.type]}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TypeSpecificProps({
  element,
  updateProps,
}: {
  element: BuilderElement;
  updateProps: (u: Record<string, unknown>) => void;
}) {
  switch (element.type) {
    case "button": {
      const p = element.props as ButtonProps;
      return (
        <div className="space-y-3">
          <Field label="Label">
            <Input
              value={p.label}
              onChange={(e) => updateProps({ label: e.target.value })}
              className="text-xs"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Variant">
              <SelectField
                value={p.variant}
                onChange={(v) => updateProps({ variant: v })}
                options={[
                  { value: "filled", label: "Filled" },
                  { value: "outline", label: "Outline" },
                  { value: "ghost", label: "Ghost" },
                ]}
              />
            </Field>
            <Field label="Background">
              <SelectField
                value={p.backgroundColor}
                onChange={(v) => updateProps({ backgroundColor: v })}
                options={[
                  { value: "accent", label: "Accent" },
                  { value: "surface", label: "Surface" },
                  { value: "foreground", label: "Foreground" },
                ]}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Radius">
              <SelectField
                value={p.borderRadius}
                onChange={(v) => updateProps({ borderRadius: v })}
                options={[
                  { value: "sm", label: "Small" },
                  { value: "md", label: "Medium" },
                  { value: "lg", label: "Large" },
                  { value: "pill", label: "Pill" },
                ]}
              />
            </Field>
            <Field label="Padding">
              <SelectField
                value={p.padding}
                onChange={(v) => updateProps({ padding: v })}
                options={[
                  { value: "sm", label: "Small" },
                  { value: "md", label: "Medium" },
                  { value: "lg", label: "Large" },
                ]}
              />
            </Field>
          </div>
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={p.fullWidth}
                onChange={(e) => updateProps({ fullWidth: e.target.checked })}
                className="rounded accent-primary"
              />
              <span className="text-xs text-muted-foreground">Full width</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={p.isPrimary}
                onChange={(e) => updateProps({ isPrimary: e.target.checked })}
                className="rounded accent-primary"
              />
              <span className="text-xs text-muted-foreground">Pay action</span>
            </label>
          </div>
        </div>
      );
    }

    case "text": {
      const p = element.props as TextProps;
      return (
        <div className="space-y-3">
          <Field label="Content">
            <Input
              value={p.content}
              onChange={(e) => updateProps({ content: e.target.value })}
              className="text-xs"
            />
          </Field>
          <Field label="Tag">
            <SelectField
              value={p.tag}
              onChange={(v) => updateProps({ tag: v })}
              options={[
                { value: "p", label: "Paragraph" },
                { value: "h2", label: "Heading 2" },
                { value: "h3", label: "Heading 3" },
                { value: "small", label: "Small" },
                { value: "strong", label: "Strong" },
              ]}
            />
          </Field>
        </div>
      );
    }

    case "image": {
      const p = element.props as ImageProps;
      return (
        <div className="space-y-3">
          <Field label="Image URL">
            <Input
              value={p.src}
              onChange={(e) => updateProps({ src: e.target.value })}
              className="text-xs"
              placeholder="https://..."
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Alt text">
              <Input
                value={p.alt}
                onChange={(e) => updateProps({ alt: e.target.value })}
                className="text-xs"
              />
            </Field>
            <Field label="Max height">
              <Input
                value={p.maxHeight}
                onChange={(e) => updateProps({ maxHeight: e.target.value })}
                className="text-xs"
                placeholder="48px"
              />
            </Field>
          </div>
          <Field label="Align">
            <SelectField
              value={p.align}
              onChange={(v) => updateProps({ align: v })}
              options={[
                { value: "left", label: "Left" },
                { value: "center", label: "Center" },
                { value: "right", label: "Right" },
              ]}
            />
          </Field>
        </div>
      );
    }

    case "container": {
      const p = element.props as ContainerProps;
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Background">
              <SelectField
                value={p.background}
                onChange={(v) => updateProps({ background: v })}
                options={[
                  { value: "none", label: "None" },
                  { value: "surface", label: "Surface" },
                ]}
              />
            </Field>
            <Field label="Padding">
              <SelectField
                value={p.padding}
                onChange={(v) => updateProps({ padding: v })}
                options={[
                  { value: "none", label: "None" },
                  { value: "sm", label: "Small" },
                  { value: "md", label: "Medium" },
                  { value: "lg", label: "Large" },
                ]}
              />
            </Field>
          </div>
          <Field label="Gap">
            <SelectField
              value={p.gap}
              onChange={(v) => updateProps({ gap: v })}
              options={[
                { value: "sm", label: "Small" },
                { value: "md", label: "Medium" },
                { value: "lg", label: "Large" },
              ]}
            />
          </Field>
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={p.borderVisible}
              onChange={(e) => updateProps({ borderVisible: e.target.checked })}
              className="rounded accent-primary"
            />
            <span className="text-xs text-muted-foreground">Show border</span>
          </label>
        </div>
      );
    }

    case "divider": {
      const p = element.props as DividerProps;
      return (
        <Field label="Spacing">
          <SelectField
            value={p.spacing}
            onChange={(v) => updateProps({ spacing: v })}
            options={[
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
            ]}
          />
        </Field>
      );
    }

    case "spacer": {
      const p = element.props as SpacerProps;
      return (
        <Field label="Size">
          <SelectField
            value={p.size}
            onChange={(v) => updateProps({ size: v })}
            options={[
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
            ]}
          />
        </Field>
      );
    }
  }
}

function StyleProps({
  style,
  onChange,
  showText,
}: {
  style: ElementStyle;
  onChange: (u: Partial<ElementStyle>) => void;
  showText: boolean;
}) {
  return (
    <div className="space-y-3">
      {showText && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Font size">
              <SelectField
                value={style.fontSize}
                onChange={(v) =>
                  onChange({ fontSize: v as ElementStyle["fontSize"] })
                }
                options={[
                  { value: "sm", label: "Small" },
                  { value: "base", label: "Base" },
                  { value: "lg", label: "Large" },
                  { value: "xl", label: "Extra large" },
                ]}
              />
            </Field>
            <Field label="Weight">
              <SelectField
                value={style.fontWeight}
                onChange={(v) =>
                  onChange({ fontWeight: v as ElementStyle["fontWeight"] })
                }
                options={[
                  { value: "normal", label: "Normal" },
                  { value: "medium", label: "Medium" },
                  { value: "semibold", label: "Semibold" },
                  { value: "bold", label: "Bold" },
                ]}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Color">
              <SelectField
                value={style.color}
                onChange={(v) =>
                  onChange({ color: v as ElementStyle["color"] })
                }
                options={[
                  { value: "foreground", label: "Foreground" },
                  { value: "muted", label: "Muted" },
                  { value: "accent", label: "Accent" },
                  { value: "positive", label: "Positive" },
                  { value: "negative", label: "Negative" },
                ]}
              />
            </Field>
            <Field label="Align">
              <SelectField
                value={style.textAlign}
                onChange={(v) =>
                  onChange({ textAlign: v as ElementStyle["textAlign"] })
                }
                options={[
                  { value: "left", label: "Left" },
                  { value: "center", label: "Center" },
                  { value: "right", label: "Right" },
                ]}
              />
            </Field>
          </div>
        </>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Margin top">
          <SelectField
            value={style.marginTop}
            onChange={(v) =>
              onChange({ marginTop: v as ElementStyle["marginTop"] })
            }
            options={[
              { value: "none", label: "None" },
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
            ]}
          />
        </Field>
        <Field label="Margin bottom">
          <SelectField
            value={style.marginBottom}
            onChange={(v) =>
              onChange({ marginBottom: v as ElementStyle["marginBottom"] })
            }
            options={[
              { value: "none", label: "None" },
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
            ]}
          />
        </Field>
      </div>
    </div>
  );
}

// ── Shared helpers ──

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={(v: string | null) => v && onChange(v)}>
      <SelectTrigger className="w-full text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function elementLabel(el: BuilderElement): string {
  switch (el.type) {
    case "button":
      return (el.props as ButtonProps).label || "Button";
    case "text":
      return (el.props as TextProps).content?.slice(0, 30) || "Text";
    case "image":
      return (el.props as ImageProps).alt || "Image";
    case "container":
      return "Container";
    case "divider":
      return "Divider";
    case "spacer":
      return "Spacer";
  }
}
