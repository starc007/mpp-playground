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

  const html = buildPreviewPage(script);
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function buildPreviewPage(userScript: string): string {
  // Escape </script> inside the user script to avoid breaking out
  const safeScript = userScript.replace(/<\/script/gi, "<\\/script");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <title>Payment Required</title>
  <style>
    *, ::after, ::before { box-sizing: border-box; margin: 0; padding: 0; border: 0 solid; }
    html { line-height: 1.5; -webkit-text-size-adjust: 100%; }
    h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
    img, svg, video { display: block; vertical-align: middle; max-width: 100%; height: auto; }
    button, input, select, textarea { font: inherit; color: inherit; background-color: transparent; }
    button { appearance: button; cursor: pointer; }
    ol, ul { list-style: none; }

    :root {
      color-scheme: light dark;
      --mppx-font-family: system-ui, -apple-system, sans-serif;
      --mppx-font-size-base: 16px;
      --mppx-radius: 6px;
      --mppx-spacing-unit: 2px;
      --mppx-accent: #171717;
      --mppx-background: #ffffff;
      --mppx-border: #e5e5e5;
      --mppx-foreground: #0a0a0a;
      --mppx-muted: #666666;
      --mppx-negative: #e5484d;
      --mppx-positive: #30a46c;
      --mppx-surface: #f5f5f5;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --mppx-accent: #ededed;
        --mppx-background: #0a0a0a;
        --mppx-border: #2e2e2e;
        --mppx-foreground: #ededed;
        --mppx-muted: #a1a1a1;
        --mppx-negative: #e5484d;
        --mppx-positive: #30a46c;
        --mppx-surface: #1a1a1a;
      }
    }
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
      <span>Payment Required</span>
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
          "title": "Payment Required",
          "pay": "Pay",
          "paymentRequired": "Payment Required",
          "expires": "Expires at"
        },
        "theme": {}
      }
    }
    </script>
    <script>
    // Mock the Html module so user scripts calling Html.init() work
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
