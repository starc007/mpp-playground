/**
 * Types, templates, and script generation for the Custom Script Builder.
 * Produces Html.init('tempo') scripts from a GUI-defined element list.
 */

export type ElementType =
  | "button"
  | "text"
  | "image"
  | "container"
  | "divider"
  | "spacer";

/** Shared style props available on most elements. */
export interface ElementStyle {
  fontSize: "sm" | "base" | "lg" | "xl";
  fontWeight: "normal" | "medium" | "semibold" | "bold";
  color: "foreground" | "muted" | "accent" | "negative" | "positive";
  textAlign: "left" | "center" | "right";
  marginTop: "none" | "sm" | "md" | "lg";
  marginBottom: "none" | "sm" | "md" | "lg";
}

export interface ButtonProps {
  label: string;
  variant: "filled" | "outline" | "ghost";
  fullWidth: boolean;
  isPrimary: boolean; // the pay action button
  backgroundColor: "accent" | "surface" | "foreground";
  borderRadius: "sm" | "md" | "lg" | "pill";
  padding: "sm" | "md" | "lg";
}

export interface TextProps {
  content: string;
  tag: "p" | "small" | "strong" | "h2" | "h3";
}

export interface ImageProps {
  src: string;
  alt: string;
  maxHeight: string;
  align: "left" | "center" | "right";
}

export interface ContainerProps {
  borderVisible: boolean;
  padding: "none" | "sm" | "md" | "lg";
  gap: "sm" | "md" | "lg";
  background: "none" | "surface";
}

export interface DividerProps {
  spacing: "sm" | "md" | "lg";
}

export interface SpacerProps {
  size: "sm" | "md" | "lg";
}

export type ElementProps =
  | ButtonProps
  | TextProps
  | ImageProps
  | ContainerProps
  | DividerProps
  | SpacerProps;

export interface BuilderElement {
  id: string;
  type: ElementType;
  props: ElementProps;
  style: ElementStyle;
}

// ── Defaults ──

const DEFAULT_STYLE: ElementStyle = {
  fontSize: "base",
  fontWeight: "normal",
  color: "foreground",
  textAlign: "left",
  marginTop: "none",
  marginBottom: "none",
};

export function createButton(partial?: Partial<ButtonProps>): BuilderElement {
  return {
    id: uid(),
    type: "button",
    props: {
      label: "Pay Now",
      variant: "filled",
      fullWidth: true,
      isPrimary: true,
      backgroundColor: "accent",
      borderRadius: "md",
      padding: "md",
      ...partial,
    },
    style: { ...DEFAULT_STYLE, fontWeight: "medium", textAlign: "center" },
  };
}

export function createText(partial?: Partial<TextProps>): BuilderElement {
  return {
    id: uid(),
    type: "text",
    props: { content: "Text content", tag: "p", ...partial },
    style: { ...DEFAULT_STYLE },
  };
}

export function createImage(partial?: Partial<ImageProps>): BuilderElement {
  return {
    id: uid(),
    type: "image",
    props: { src: "", alt: "", maxHeight: "48px", align: "center", ...partial },
    style: { ...DEFAULT_STYLE },
  };
}

export function createContainer(
  partial?: Partial<ContainerProps>,
): BuilderElement {
  return {
    id: uid(),
    type: "container",
    props: {
      borderVisible: true,
      padding: "md",
      gap: "md",
      background: "surface",
      ...partial,
    },
    style: { ...DEFAULT_STYLE },
  };
}

export function createDivider(partial?: Partial<DividerProps>): BuilderElement {
  return {
    id: uid(),
    type: "divider",
    props: { spacing: "md", ...partial },
    style: { ...DEFAULT_STYLE },
  };
}

export function createSpacer(partial?: Partial<SpacerProps>): BuilderElement {
  return {
    id: uid(),
    type: "spacer",
    props: { size: "md", ...partial },
    style: { ...DEFAULT_STYLE },
  };
}

// ── Templates ──

export interface Template {
  name: string;
  description: string;
  elements: () => BuilderElement[];
}

export const TEMPLATES: Template[] = [
  {
    name: "Default Tempo",
    description: "Stock Tempo button with logo",
    elements: () => [
      createButton({
        label: "Continue with Tempo",
        variant: "filled",
        fullWidth: true,
        isPrimary: true,
      }),
    ],
  },
  {
    name: "Minimal",
    description: "Plain pay button, no frills",
    elements: () => [
      createButton({
        label: "Pay",
        variant: "filled",
        fullWidth: true,
        isPrimary: true,
        borderRadius: "sm",
      }),
    ],
  },
  {
    name: "Branded",
    description: "Logo image with a styled button",
    elements: () => [
      createImage({
        src: "https://placehold.co/120x40/171717/FFFFFF?text=Logo",
        alt: "Brand logo",
        maxHeight: "40px",
        align: "center",
      }),
      createButton({
        label: "Pay Now",
        variant: "filled",
        fullWidth: true,
        isPrimary: true,
        borderRadius: "lg",
      }),
    ],
  },
  {
    name: "Info Card",
    description: "Description + terms inside a card",
    elements: () => [
      createContainer({
        borderVisible: true,
        padding: "md",
        gap: "md",
        background: "surface",
      }),
      createText({ content: "Complete your purchase securely.", tag: "p" }),
      createText({
        content: "By continuing you agree to our terms of service.",
        tag: "small",
      }),
      createContainer({
        borderVisible: false,
        padding: "none",
        gap: "sm",
        background: "none",
      }),
      createButton({
        label: "Complete Payment",
        variant: "filled",
        fullWidth: true,
        isPrimary: true,
      }),
    ],
  },
  {
    name: "Multi-action",
    description: "Primary + secondary button options",
    elements: () => [
      createButton({
        label: "Pay with Tempo",
        variant: "filled",
        fullWidth: true,
        isPrimary: true,
      }),
      createButton({
        label: "Other payment options",
        variant: "outline",
        fullWidth: true,
        isPrimary: false,
        backgroundColor: "surface",
      }),
    ],
  },
  {
    name: "Blank",
    description: "Start from scratch",
    elements: () => [],
  },
];

// ── Script Generation ──

const FONT_SIZE_MAP = { sm: "0.875rem", base: "1rem", lg: "1.125rem", xl: "1.5rem" };
const FONT_WEIGHT_MAP = { normal: "400", medium: "500", semibold: "600", bold: "700" };
const SPACING_MAP = { none: "0", sm: "2", md: "4", lg: "8" };
const RADIUS_MAP = { sm: "4", md: "", lg: "12", pill: "50" };
const PADDING_MAP = { sm: "2", md: "4", lg: "6" };
const GAP_MAP = { sm: "2", md: "4", lg: "8" };

function cssVar(token: string) {
  return `\${c.vars.${token}}`;
}

function spacingCalc(multiplier: string) {
  if (multiplier === "0") return "0";
  return `calc(\${c.vars.spacingUnit} * ${multiplier})`;
}

function buildElementStyle(style: ElementStyle): string[] {
  const lines: string[] = [];
  lines.push(`font-size: ${FONT_SIZE_MAP[style.fontSize]};`);
  lines.push(`font-weight: ${FONT_WEIGHT_MAP[style.fontWeight]};`);
  lines.push(`color: ${cssVar(style.color)};`);
  if (style.textAlign !== "left") lines.push(`text-align: ${style.textAlign};`);
  if (style.marginTop !== "none")
    lines.push(`margin-top: ${spacingCalc(SPACING_MAP[style.marginTop])};`);
  if (style.marginBottom !== "none")
    lines.push(`margin-bottom: ${spacingCalc(SPACING_MAP[style.marginBottom])};`);
  return lines;
}

export function generateScript(elements: BuilderElement[]): string {
  if (elements.length === 0) {
    return `const c = Html.init('tempo')\n\n// Add your custom elements here\n// c.root.appendChild(...)`;
  }

  const cssRules: string[] = [];
  const domLines: string[] = [];
  let btnIndex = 0;
  let textIndex = 0;
  let imgIndex = 0;
  let containerOpen = false;
  let containerVar = "";

  for (const el of elements) {
    switch (el.type) {
      case "button": {
        const p = el.props as ButtonProps;
        const cls = `custom-btn-${btnIndex}`;
        const varName = `btn${btnIndex}`;
        const styleLines = buildElementStyle(el.style);

        // Button-specific styles
        const radius = RADIUS_MAP[p.borderRadius]
          ? spacingCalc(RADIUS_MAP[p.borderRadius])
          : cssVar("radius");
        const pad = spacingCalc(PADDING_MAP[p.padding]);

        if (p.variant === "filled") {
          styleLines.push(`background: ${cssVar(p.backgroundColor)};`);
          styleLines.push(
            `color: ${p.backgroundColor === "accent" ? cssVar("background") : cssVar("foreground")};`,
          );
        } else if (p.variant === "outline") {
          styleLines.push(`background: transparent;`);
          styleLines.push(`border: 1px solid ${cssVar("border")};`);
        } else {
          styleLines.push(`background: transparent;`);
        }
        styleLines.push(`border-radius: ${radius};`);
        styleLines.push(`cursor: pointer;`);
        styleLines.push(`padding: ${pad} calc(${cssVar("spacingUnit")} * 8);`);
        if (p.fullWidth) styleLines.push(`width: 100%;`);

        cssRules.push(
          `  .${cls} {\n    ${styleLines.join("\n    ")}\n  }`,
          `  .${cls}:hover:not(:disabled) { opacity: 0.85; }`,
          `  .${cls}:disabled { cursor: default; opacity: 0.5; }`,
        );

        domLines.push(`const ${varName} = document.createElement('button')`);
        domLines.push(`${varName}.className = '${cls}'`);
        domLines.push(
          `${varName}.textContent = ${JSON.stringify(p.label)}`,
        );

        if (p.isPrimary) {
          domLines.push(`${varName}.onclick = async () => {`);
          domLines.push(`  try {`);
          domLines.push(`    c.error()`);
          domLines.push(`    ${varName}.disabled = true`);
          domLines.push(`    // Wire up your payment logic here`);
          domLines.push(
            `    // const credential = await method.createCredential({ challenge: c.challenge, context: {} })`,
          );
          domLines.push(`    // await c.submit(credential)`);
          domLines.push(`  } catch (e) {`);
          domLines.push(
            `    c.error(e instanceof Error ? e.message : 'Payment failed')`,
          );
          domLines.push(`  } finally {`);
          domLines.push(`    ${varName}.disabled = false`);
          domLines.push(`  }`);
          domLines.push(`}`);
        }

        if (containerOpen) {
          domLines.push(`${containerVar}.appendChild(${varName})`);
        } else {
          domLines.push(`c.root.appendChild(${varName})`);
        }
        domLines.push(``);
        btnIndex++;
        break;
      }

      case "text": {
        const p = el.props as TextProps;
        const cls = `custom-text-${textIndex}`;
        const varName = `text${textIndex}`;
        const styleLines = buildElementStyle(el.style);

        cssRules.push(`  .${cls} {\n    ${styleLines.join("\n    ")}\n  }`);

        domLines.push(
          `const ${varName} = document.createElement('${p.tag}')`,
        );
        domLines.push(`${varName}.className = '${cls}'`);
        domLines.push(
          `${varName}.textContent = ${JSON.stringify(p.content)}`,
        );
        if (containerOpen) {
          domLines.push(`${containerVar}.appendChild(${varName})`);
        } else {
          domLines.push(`c.root.appendChild(${varName})`);
        }
        domLines.push(``);
        textIndex++;
        break;
      }

      case "image": {
        const p = el.props as ImageProps;
        const cls = `custom-img-${imgIndex}`;
        const varName = `img${imgIndex}`;
        const styleLines: string[] = [];
        styleLines.push(`max-height: ${p.maxHeight};`);
        if (p.align === "center")
          styleLines.push(`margin-left: auto;`, `margin-right: auto;`);
        else if (p.align === "right") styleLines.push(`margin-left: auto;`);
        if (el.style.marginTop !== "none")
          styleLines.push(
            `margin-top: ${spacingCalc(SPACING_MAP[el.style.marginTop])};`,
          );
        if (el.style.marginBottom !== "none")
          styleLines.push(
            `margin-bottom: ${spacingCalc(SPACING_MAP[el.style.marginBottom])};`,
          );

        cssRules.push(`  .${cls} {\n    ${styleLines.join("\n    ")}\n  }`);

        domLines.push(`const ${varName} = document.createElement('img')`);
        domLines.push(`${varName}.className = '${cls}'`);
        domLines.push(`${varName}.src = ${JSON.stringify(p.src)}`);
        domLines.push(`${varName}.alt = ${JSON.stringify(p.alt)}`);
        if (containerOpen) {
          domLines.push(`${containerVar}.appendChild(${varName})`);
        } else {
          domLines.push(`c.root.appendChild(${varName})`);
        }
        domLines.push(``);
        imgIndex++;
        break;
      }

      case "container": {
        const p = el.props as ContainerProps;
        if (containerOpen) {
          // Close previous container
          domLines.push(`c.root.appendChild(${containerVar})`);
          domLines.push(``);
        }
        containerVar = `container${cssRules.length}`;
        const cls = `custom-container-${cssRules.length}`;
        const styleLines: string[] = [];
        styleLines.push(`display: flex;`);
        styleLines.push(`flex-direction: column;`);
        styleLines.push(`gap: ${spacingCalc(GAP_MAP[p.gap])};`);
        if (p.padding !== "none")
          styleLines.push(`padding: ${spacingCalc(PADDING_MAP[p.padding])};`);
        if (p.borderVisible)
          styleLines.push(`border: 1px solid ${cssVar("border")};`);
        styleLines.push(`border-radius: ${cssVar("radius")};`);
        if (p.background === "surface")
          styleLines.push(`background: ${cssVar("surface")};`);

        cssRules.push(
          `  .${cls} {\n    ${styleLines.join("\n    ")}\n  }`,
        );

        domLines.push(
          `const ${containerVar} = document.createElement('div')`,
        );
        domLines.push(`${containerVar}.className = '${cls}'`);
        containerOpen = true;
        break;
      }

      case "divider": {
        const p = el.props as DividerProps;
        const spacing = spacingCalc(SPACING_MAP[p.spacing]);
        const varName = `hr${cssRules.length}`;
        cssRules.push(
          `  .custom-hr { border-top: 1px solid ${cssVar("border")}; margin: ${spacing} 0; }`,
        );
        domLines.push(`const ${varName} = document.createElement('hr')`);
        domLines.push(`${varName}.className = 'custom-hr'`);
        if (containerOpen) {
          domLines.push(`${containerVar}.appendChild(${varName})`);
        } else {
          domLines.push(`c.root.appendChild(${varName})`);
        }
        domLines.push(``);
        break;
      }

      case "spacer": {
        const p = el.props as SpacerProps;
        const size = spacingCalc(SPACING_MAP[p.size]);
        const varName = `spacer${cssRules.length}`;
        domLines.push(`const ${varName} = document.createElement('div')`);
        domLines.push(`${varName}.style.height = '${size}'`);
        if (containerOpen) {
          domLines.push(`${containerVar}.appendChild(${varName})`);
        } else {
          domLines.push(`c.root.appendChild(${varName})`);
        }
        domLines.push(``);
        break;
      }
    }
  }

  // Close any open container
  if (containerOpen) {
    domLines.push(`c.root.appendChild(${containerVar})`);
  }

  // Root layout — vertical flex with gap for spacing between elements
  cssRules.unshift(
    `  #root, [aria-label="Payment form"] {\n    display: flex;\n    flex-direction: column;\n    gap: calc(\${c.vars.spacingUnit} * 6);\n  }`,
  );

  const css = `\nconst style = document.createElement('style')\nstyle.textContent = \`\n${cssRules.join("\n")}\n\`\nc.root.append(style)\n`;

  return `const c = Html.init('tempo')\n${css}\n${domLines.join("\n")}`;
}

// ── Utils ──

let counter = 0;
function uid(): string {
  return `el_${Date.now().toString(36)}_${(counter++).toString(36)}`;
}
