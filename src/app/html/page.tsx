"use client";

import { useState, useMemo } from "react";
import { Copy, Check, RotateCcw } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ColorPickerField } from "@/components/color-picker";
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
  DEFAULT_THEME,
  DEFAULT_TEXT,
  COLOR_TOKENS,
  TEXT_FIELDS,
  PRESETS,
  buildServerConfig,
  type HtmlTheme,
  type HtmlText,
  type LightDark,
} from "@/lib/html-builder-types";

export default function HtmlBuilderPage() {
  const [theme, setTheme] = useState<HtmlTheme>({ ...DEFAULT_THEME });
  const [text, setText] = useState<HtmlText>({ ...DEFAULT_TEXT });
  const [copied, setCopied] = useState(false);

  const previewUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams();
    params.set("amount", "1.00");
    params.set("description", "Premium API access");
    params.set("theme", JSON.stringify(theme));
    params.set("text", JSON.stringify(text));
    return `/api/html-preview?${params.toString()}`;
  }, [theme, text]);

  const serverConfig = useMemo(
    () => buildServerConfig(theme, text),
    [theme, text],
  );

  const hasChanges =
    JSON.stringify(serverConfig) !== JSON.stringify({});

  const configCode = `tempo.charge({
  html: ${JSON.stringify(serverConfig, null, 4).replace(/"([^"]+)":/g, "$1:")},
})`;

  function updateThemeColor(key: string, value: LightDark) {
    setTheme((prev) => ({ ...prev, [key]: value }));
  }

  function applyPreset(name: string) {
    const preset = PRESETS.find((p) => p.name === name);
    if (preset) setTheme({ ...preset.theme });
  }

  function resetAll() {
    setTheme({ ...DEFAULT_THEME });
    setText({ ...DEFAULT_TEXT });
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(configCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DashboardLayout
      title="HTML Builder"
      description="Customize the mppx payment page visually. Pick colors, text, and layout — see changes live."
    >
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6 items-start">
        {/* Left: Controls */}
        <div className="space-y-6">
          {/* Preset selector + reset */}
          <div className="flex items-center gap-3">
            <Select onValueChange={(v: string | null) => v && applyPreset(v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Presets" />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={resetAll}>
              <RotateCcw className="size-3.5 mr-1.5" />
              reset
            </Button>
          </div>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Color scheme">
                <Select
                  value={theme.colorScheme}
                  onValueChange={(v) =>
                    v &&
                    setTheme((prev) => ({
                      ...prev,
                      colorScheme: v as HtmlTheme["colorScheme"],
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light dark">Auto</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {COLOR_TOKENS.map((token) => (
                <ColorPickerField
                  key={token.key}
                  label={token.label}
                  description={token.description}
                  value={
                    theme[token.key as keyof HtmlTheme] as LightDark
                  }
                  onChange={(v) => updateThemeColor(token.key, v)}
                />
              ))}
            </CardContent>
          </Card>

          {/* Layout */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Layout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Font family">
                <Input
                  value={theme.fontFamily}
                  onChange={(e) =>
                    setTheme((prev) => ({
                      ...prev,
                      fontFamily: e.target.value,
                    }))
                  }
                  className="text-xs font-mono"
                />
              </Field>
              <Field label="Font size">
                <Input
                  value={theme.fontSizeBase}
                  onChange={(e) =>
                    setTheme((prev) => ({
                      ...prev,
                      fontSizeBase: e.target.value,
                    }))
                  }
                  placeholder="16px"
                  className="text-xs"
                />
              </Field>
              <Field label="Border radius">
                <Input
                  value={theme.radius}
                  onChange={(e) =>
                    setTheme((prev) => ({
                      ...prev,
                      radius: e.target.value,
                    }))
                  }
                  placeholder="6px"
                  className="text-xs"
                />
              </Field>
              <Field label="Spacing unit">
                <Input
                  value={theme.spacingUnit}
                  onChange={(e) =>
                    setTheme((prev) => ({
                      ...prev,
                      spacingUnit: e.target.value,
                    }))
                  }
                  placeholder="2px"
                  className="text-xs"
                />
              </Field>
            </CardContent>
          </Card>

          {/* Text */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Text</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {TEXT_FIELDS.map((field) => (
                <Field key={field.key} label={field.label}>
                  <Input
                    value={text[field.key as keyof HtmlText]}
                    onChange={(e) =>
                      setText((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    className="text-xs"
                  />
                </Field>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview + Config output */}
        <div className="space-y-6 xl:sticky xl:top-6">
          {/* Live preview */}
          <Card className="overflow-hidden p-0 gap-0">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <span className="text-xs text-muted-foreground">
                Live Preview
              </span>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                open in new tab ↗
              </a>
            </div>
            <div className="relative bg-white h-150">
              {previewUrl && (
                <iframe
                  key={previewUrl}
                  src={previewUrl}
                  className="w-full h-full"
                  title="Payment page preview"
                />
              )}
            </div>
          </Card>

          {/* Config output */}
          {hasChanges && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm">Server Config</CardTitle>
                <Button variant="outline" size="xs" onClick={handleCopy}>
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  {copied ? "copied" : "copy"}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap overflow-auto max-h-64 p-3 rounded-lg border border-border bg-bg">
                  {configCode}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-text-dim uppercase tracking-wider">
        {label}
      </Label>
      {children}
    </div>
  );
}
