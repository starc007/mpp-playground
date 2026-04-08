import { NextRequest, NextResponse } from "next/server";

/**
 * Parse RFC auth-params from WWW-Authenticate header.
 * Format: Payment id="...", realm="...", method="...", intent="...", request="base64..."
 */
function parseWwwAuthenticate(header: string): Record<string, string> | null {
  const match = header.match(/^Payment\s+(.+)$/i);
  if (!match?.[1]) return null;

  const params: Record<string, string> = {};
  const regex = /(\w+)="([^"\\]*(?:\\.[^"\\]*)*)"/g;
  let m;
  while ((m = regex.exec(match[1])) !== null) {
    params[m[1]] = m[2];
  }
  return params;
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const targetUrl = url.startsWith("http") ? url : `https://${url}`;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "mpp-playground/1.0",
        Accept: "application/json",
      },
      redirect: "follow",
    });

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const requestHeaders: Record<string, string> = {
      "User-Agent": "mpp-playground/1.0",
      Accept: "application/json",
    };

    if (response.status === 402) {
      const wwwAuth = response.headers.get("www-authenticate");
      let challenge = null;

      if (wwwAuth) {
        const params = parseWwwAuthenticate(wwwAuth);
        if (params) {
          // Decode base64 request field to JSON
          let request: Record<string, unknown> = {};
          if (params.request) {
            try {
              const decoded = Buffer.from(params.request, "base64").toString(
                "utf-8",
              );
              request = JSON.parse(decoded);
            } catch {
              // keep raw
              request = { raw: params.request };
            }
          }

          challenge = {
            id: params.id,
            realm: params.realm,
            method: params.method,
            intent: params.intent,
            request,
            ...(params.description && { description: params.description }),
            ...(params.expires && { expires: params.expires }),
          };
        }
      }

      let body = null;
      try {
        body = await response.json();
      } catch {
        try {
          body = await response.text();
        } catch {
          // no body
        }
      }

      return NextResponse.json({
        mppEnabled: true,
        statusCode: 402,
        challenge,
        requestHeaders,
        responseHeaders,
        body,
        rawWwwAuthenticate: wwwAuth,
      });
    }

    let body = null;
    try {
      body = await response.json();
    } catch {
      try {
        body = await response.text();
      } catch {
        // no body
      }
    }

    return NextResponse.json({
      mppEnabled: false,
      statusCode: response.status,
      challenge: null,
      requestHeaders,
      responseHeaders,
      body,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to probe: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
