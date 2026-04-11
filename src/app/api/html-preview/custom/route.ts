import { NextRequest, NextResponse } from "next/server";

/**
 * Renders a custom Html.init script inside a mock mppx payment page shell.
 * We can't use tempo.charge() because it hardcodes the built-in Tempo button.
 * Instead, we replicate the page layout and mock the Html.init API so the
 * user's script can run as if it were inside a real payment page.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const scriptB64 = params.get("script");
  if (!scriptB64) {
    return new NextResponse("script param required", { status: 400 });
  }

  let script: string;
  try {
    script = Buffer.from(scriptB64, "base64").toString("utf-8");
  } catch {
    return new NextResponse("invalid base64", { status: 400 });
  }

  // Parse optional theme/text overrides
  let theme: Record<string, unknown> = {};
  const themeParam = params.get("theme");
  if (themeParam) {
    try {
      theme = JSON.parse(themeParam);
    } catch {}
  }

  let text: Record<string, string> = {};
  const textParam = params.get("text");
  if (textParam) {
    try {
      text = JSON.parse(textParam);
    } catch {}
  }

  const html = buildPreviewPage(script, theme, text);
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// Default theme values
const DEFAULTS = {
  colorScheme: "light dark",
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontSizeBase: "16px",
  radius: "6px",
  spacingUnit: "2px",
  accent: ["#171717", "#ededed"],
  background: ["#ffffff", "#0a0a0a"],
  border: ["#e5e5e5", "#2e2e2e"],
  foreground: ["#0a0a0a", "#ededed"],
  muted: ["#666666", "#a1a1a1"],
  negative: ["#e5484d", "#e5484d"],
  positive: ["#30a46c", "#30a46c"],
  surface: ["#f5f5f5", "#1a1a1a"],
};

const COLOR_TOKENS = [
  "accent",
  "background",
  "border",
  "foreground",
  "muted",
  "negative",
  "positive",
  "surface",
] as const;

function resolveColor(
  value: unknown,
  fallback: string[],
): [string, string] {
  if (Array.isArray(value) && value.length >= 2)
    return [value[0], value[1]];
  if (typeof value === "string") return [value, value];
  return [fallback[0]!, fallback[1]!];
}

function buildPreviewPage(
  userScript: string,
  theme: Record<string, unknown>,
  text: Record<string, string>,
): string {
  const safeScript = userScript.replace(/<\/script/gi, "<\\/script");

  // Resolve theme
  const colorScheme =
    (theme.colorScheme as string) ?? DEFAULTS.colorScheme;
  const fontFamily =
    (theme.fontFamily as string) ?? DEFAULTS.fontFamily;
  const fontSizeBase =
    (theme.fontSizeBase as string) ?? DEFAULTS.fontSizeBase;
  const radius = (theme.radius as string) ?? DEFAULTS.radius;
  const spacingUnit =
    (theme.spacingUnit as string) ?? DEFAULTS.spacingUnit;
  const fontUrl = theme.fontUrl as string | undefined;

  // Resolve colors
  const colors: Record<string, [string, string]> = {};
  for (const token of COLOR_TOKENS) {
    colors[token] = resolveColor(
      theme[token],
      DEFAULTS[token],
    );
  }

  const isLightOnly = colorScheme === "light";
  const isDarkOnly = colorScheme === "dark";

  const lightVars = COLOR_TOKENS.map(
    (t) => `--mppx-${t}: ${colors[t]![0]};`,
  ).join("\n        ");
  const darkVars = COLOR_TOKENS.map(
    (t) => `--mppx-${t}: ${colors[t]![1]};`,
  ).join("\n          ");

  const rootVars = isDarkOnly ? darkVars : lightVars;
  const darkMedia =
    !isLightOnly && !isDarkOnly
      ? `\n      @media (prefers-color-scheme: dark) {\n        :root {\n          ${darkVars}\n        }\n      }`
      : "";

  const fontLink = fontUrl
    ? `<link rel="preconnect" href="${new URL(fontUrl).origin}" crossorigin />\n  <link rel="stylesheet" href="${fontUrl}" />`
    : "";

  // Resolve text
  const title = text.title ?? "Payment Required";
  const paymentRequired = text.paymentRequired ?? "Payment Required";
  const expiresLabel = text.expires ?? "Expires at";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="${colorScheme}" />
  <title>${esc(title)}</title>
  ${fontLink}
  <style>
    *, ::after, ::before { box-sizing: border-box; margin: 0; padding: 0; border: 0 solid; }
    html { line-height: 1.5; -webkit-text-size-adjust: 100%; }
    h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
    img, svg, video { display: block; vertical-align: middle; max-width: 100%; height: auto; }
    button, input, select, textarea { font: inherit; color: inherit; background-color: transparent; }
    button { appearance: button; cursor: pointer; }
    ol, ul { list-style: none; }

    :root {
      color-scheme: ${colorScheme};
      --mppx-font-family: ${fontFamily};
      --mppx-font-size-base: ${fontSizeBase};
      --mppx-radius: ${radius};
      --mppx-spacing-unit: ${spacingUnit};
      ${rootVars}
    }${darkMedia}
    *:focus-visible { outline: 2px solid var(--mppx-accent); outline-offset: 0.15rem; }
    body {
      -webkit-font-smoothing: antialiased;
      background: var(--mppx-background);
      color: var(--mppx-foreground);
      font-family: var(--mppx-font-family);
      font-size: var(--mppx-font-size-base);
    }
    main {
      display: flex;
      flex-direction: column;
      gap: calc(var(--mppx-spacing-unit) * 8);
      margin: 0 auto;
      max-width: clamp(300px, calc(var(--mppx-spacing-unit) * 224), 896px);
      padding: calc(var(--mppx-spacing-unit) * 12) calc(var(--mppx-spacing-unit) * 8) calc(var(--mppx-spacing-unit) * 16);
    }
    .mppx-header {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: calc(var(--mppx-spacing-unit) * 4);
      justify-content: space-between;
    }
    .mppx-header span {
      background: var(--mppx-surface);
      border: 1px solid var(--mppx-border);
      border-radius: calc(var(--mppx-spacing-unit) * 50);
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.025em;
      padding: calc(var(--mppx-spacing-unit) * 1) calc(var(--mppx-spacing-unit) * 4);
    }
    .mppx-summary {
      background: var(--mppx-surface);
      border: 1px solid var(--mppx-border);
      border-radius: var(--mppx-radius);
      display: flex;
      flex-direction: column;
      gap: calc(var(--mppx-spacing-unit) * 3);
      padding: calc(var(--mppx-spacing-unit) * 6);
    }
    .mppx-summary-amount {
      font-size: 2.5rem;
      font-variant-numeric: tabular-nums;
      font-weight: 700;
      line-height: 1.2;
    }
    .mppx-summary-description { font-size: 1.25rem; }
    .mppx-summary-expires { color: var(--mppx-muted); }
    .mppx-error {
      color: var(--mppx-negative);
      font-size: 0.95rem;
      margin-top: calc(var(--mppx-spacing-unit) * -1.5);
      text-align: center;
    }
  </style>
</head>
<body>
  <main>
    <header class="mppx-header">
      <span>${esc(paymentRequired)}</span>
    </header>
    <section class="mppx-summary" aria-label="Payment summary">
      <h1 class="mppx-summary-amount">$1.00</h1>
      <p class="mppx-summary-description">Premium API access</p>
    </section>
    <div id="root" aria-label="Payment form"></div>

    <!-- Mock Html.init so user scripts work -->
    <script id="__MPPX_DATA__" type="application/json">
    {
      "preview": {
        "label": "tempo",
        "rootId": "root",
        "formattedAmount": "$1.00",
        "config": {},
        "challenge": {
          "id": "preview-challenge",
          "method": "tempo",
          "realm": "http://localhost:3000",
          "request": {
            "amount": "1000000",
            "currency": "0x20c0000000000000000000000000000000000000",
            "recipient": "0xAf1A2E215FdB629d277a6442100092eF1e38436b",
            "methodDetails": { "chainId": 333000333 }
          },
          "description": "Premium API access"
        },
        "text": {
          "title": ${JSON.stringify(title)},
          "pay": ${JSON.stringify(text.pay ?? "Pay")},
          "paymentRequired": ${JSON.stringify(paymentRequired)},
          "expires": ${JSON.stringify(expiresLabel)}
        },
        "theme": {}
      }
    }
    </script>
    <script>
    var Html = {
      init: function(methodName) {
        var dataEl = document.getElementById('__MPPX_DATA__');
        var data = JSON.parse(dataEl.textContent).preview;
        function cssVar(token) {
          return 'var(--mppx-' + token + ')';
        }
        return {
          challenge: data.challenge,
          config: data.config,
          text: data.text,
          theme: data.theme,
          formattedAmount: data.formattedAmount,
          label: data.label,
          rootId: data.rootId,
          error: function(msg) {
            var existing = document.getElementById('root_error');
            if (!msg) { if (existing) existing.remove(); return; }
            if (existing) { existing.textContent = msg; return; }
            var el = document.createElement('p');
            el.id = 'root_error';
            el.className = 'mppx-error';
            el.role = 'alert';
            el.textContent = msg;
            document.getElementById('root').after(el);
          },
          root: document.getElementById('root'),
          submit: function(credential) {
            return Promise.resolve();
          },
          vars: {
            accent: cssVar('accent'),
            background: cssVar('background'),
            border: cssVar('border'),
            foreground: cssVar('foreground'),
            muted: cssVar('muted'),
            negative: cssVar('negative'),
            positive: cssVar('positive'),
            surface: cssVar('surface'),
            fontFamily: cssVar('font-family'),
            fontSizeBase: cssVar('font-size-base'),
            radius: cssVar('radius'),
            spacingUnit: cssVar('spacing-unit')
          }
        };
      }
    };
    </script>
    <script>${safeScript}</script>
  </main>
</body>
</html>`;
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
