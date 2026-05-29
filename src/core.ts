export type AnnotationOp = "^^" | "^_";
export type AnnotationPosition = "over" | "under";
export type UnderlineStyle = "solid" | "wavy" | "double";

export interface InlineAnnotationOptions {
  classPrefix?: string;
  enableAbbreviated?: boolean;
  inlineStyles?: boolean;
  fallbackParens?: string;
}

export interface InlineAnnotationMatch {
  start: number;
  end: number;
  html: string;
  source: string;
}

interface ResolvedOptions {
  classPrefix: string;
  enableAbbreviated: boolean;
  inlineStyles: boolean;
  fallbackParens: string;
}

const DEFAULT_OPTIONS: ResolvedOptions = {
  classPrefix: "ia",
  enableAbbreviated: true,
  inlineStyles: true,
  fallbackParens: "()",
};

const BOUTEN_PATTERN = "..";
const UNDERLINE_STYLES: Record<string, UnderlineStyle> = {
  ".-": "solid",
  ".~": "wavy",
  ".=": "double",
};

const STYLE_BOUTEN_OVER =
  "text-emphasis:filled dot;-webkit-text-emphasis:filled dot;text-emphasis-position:over right;-webkit-text-emphasis-position:over right";
const STYLE_BOUTEN_UNDER = "text-decoration:underline dotted;text-underline-offset:0.15em";
const STYLE_RUBY_OVER = "ruby-position:over";
const STYLE_RUBY_UNDER = "ruby-position:under";

function resolveOptions(options?: InlineAnnotationOptions): ResolvedOptions {
  return { ...DEFAULT_OPTIONS, ...options };
}

function isEscaped(input: string, index: number): boolean {
  let backslashes = 0;
  for (let i = index - 1; i >= 0 && input[i] === "\\"; i--) backslashes++;
  return backslashes % 2 === 1;
}

function unescapeMarkup(input: string): string {
  return input.replace(/\\(.)/g, "$1");
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapedText(input: string): string {
  return escapeHtml(unescapeMarkup(input));
}

function splitByUnescapedPipe(input: string): string[] {
  const parts: string[] = [];
  let buf = "";
  for (let i = 0; i < input.length; i++) {
    if (input[i] === "|" && !isEscaped(input, i)) {
      parts.push(buf);
      buf = "";
    } else {
      buf += input[i];
    }
  }
  parts.push(buf);
  return parts;
}

function findCloseParen(input: string, start: number, max: number): number {
  for (let i = start; i < max; i++) {
    if (input[i] === "\n" || input[i] === "\r") return -1;
    if (input[i] === ")" && !isEscaped(input, i)) return i;
  }
  return -1;
}

function findBracketClose(input: string, start: number, max: number): number {
  let depth = 0;
  for (let i = start; i < max; i++) {
    const ch = input[i];
    if (ch === "\n" || ch === "\r") return -1;
    if (ch === "[" && !isEscaped(input, i)) depth++;
    if (ch === "]" && !isEscaped(input, i)) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function opAt(input: string, index: number, max: number): AnnotationOp | null {
  if (index + 2 >= max || input[index] !== "^" || input[index + 2] !== "(") return null;
  if (isEscaped(input, index)) return null;
  if (input[index + 1] === "^") return "^^";
  if (input[index + 1] === "_") return "^_";
  return null;
}

function opposite(op: AnnotationOp): AnnotationOp {
  return op === "^^" ? "^_" : "^^";
}

function positionForOp(op: AnnotationOp): AnnotationPosition {
  return op === "^^" ? "over" : "under";
}

function className(options: ResolvedOptions, suffix: string): string {
  return `${options.classPrefix}-${suffix}`;
}

function attrStyle(style: string, options: ResolvedOptions): string {
  return options.inlineStyles && style ? ` style="${style}"` : "";
}

function rubyPositionStyle(position: AnnotationPosition): string {
  // Emit the position explicitly for both slots. `ruby-position` is a CSS
  // inherited property, so a nested over-ruby placed inside an under-ruby would
  // otherwise inherit `under` and render both annotations below the base.
  return position === "under" ? STYLE_RUBY_UNDER : STYLE_RUBY_OVER;
}

function underlineStyle(style: UnderlineStyle): string {
  let css = "text-decoration-line:underline;text-underline-offset:0.15em";
  if (style === "wavy") css += ";text-decoration-style:wavy";
  if (style === "double") css += ";text-decoration-style:double";
  return css;
}

function boutenStyle(position: AnnotationPosition): string {
  return position === "over" ? STYLE_BOUTEN_OVER : STYLE_BOUTEN_UNDER;
}

function underlineClass(options: ResolvedOptions, style: UnderlineStyle): string {
  const base = className(options, "underline");
  return style === "solid" ? base : `${base} ${className(options, `underline-${style}`)}`;
}

function splitBySpaces(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function shouldHideAnnotation(baseChar: string, annotation: string): boolean {
  return baseChar === annotation;
}

function renderEmptyRuby(baseHtml: string, position: AnnotationPosition, options: ResolvedOptions): string {
  const rubyClass = `${className(options, "ruby")} ${className(options, `ruby-${position}`)}`;
  const open = options.fallbackParens.charAt(0) || "(";
  const close = options.fallbackParens.charAt(1) || ")";
  return `<ruby class="${rubyClass}"${attrStyle(rubyPositionStyle(position), options)}>${baseHtml}<rp>${open}</rp><rt></rt><rp>${close}</rp></ruby>`;
}

function renderRubyElement(
  baseHtml: string,
  annotationHtml: string,
  position: AnnotationPosition,
  options: ResolvedOptions,
  extraClasses = "",
  extraStyle = ""
): string {
  const classes = [`${className(options, "ruby")}`, className(options, `ruby-${position}`), extraClasses]
    .filter(Boolean)
    .join(" ");
  const styles = [rubyPositionStyle(position), extraStyle].filter(Boolean).join(";");
  const open = options.fallbackParens.charAt(0) || "(";
  const close = options.fallbackParens.charAt(1) || ")";
  return `<ruby class="${classes}"${attrStyle(styles, options)}>${baseHtml}<rp>${open}</rp><rt>${annotationHtml}</rt><rp>${close}</rp></ruby>`;
}

function renderBouten(baseHtml: string, position: AnnotationPosition, options: ResolvedOptions): string {
  const classes = `${className(options, "bouten")} ${className(options, `bouten-${position}`)}`;
  return `<span class="${classes}"${attrStyle(boutenStyle(position), options)}>${baseHtml}</span>`;
}

function renderBoutenBoth(baseHtml: string, options: ResolvedOptions): string {
  const classes = `${className(options, "bouten")} ${className(options, "bouten-over")} ${className(options, "bouten-under")}`;
  return `<span class="${classes}"${attrStyle(`${STYLE_BOUTEN_OVER};${STYLE_BOUTEN_UNDER}`, options)}>${baseHtml}</span>`;
}

function renderUnderline(baseHtml: string, style: UnderlineStyle, options: ResolvedOptions): string {
  return `<span class="${underlineClass(options, style)}"${attrStyle(underlineStyle(style), options)}>${baseHtml}</span>`;
}

function renderRubyWithDecoration(
  baseHtml: string,
  rubyHtml: string,
  rubyOp: AnnotationOp,
  decorationOp: AnnotationOp,
  decoration: "bouten" | "underline",
  underline: UnderlineStyle | null,
  options: ResolvedOptions
): string {
  const rubyPosition = positionForOp(rubyOp);
  const decorationPosition = positionForOp(decorationOp);
  const decorationClass =
    decoration === "bouten"
      ? className(options, `bouten-${decorationPosition}`)
      : underlineClass(options, underline ?? "solid");
  const style =
    decoration === "bouten"
      ? boutenStyle(decorationPosition)
      : underlineStyle(underline ?? "solid");
  return renderRubyElement(
    baseHtml,
    rubyHtml,
    rubyPosition,
    options,
    `${className(options, "ruby-mixed")} ${decorationClass}`,
    style
  );
}

function renderRubyLevels(baseHtml: string, plainBase: string, op: AnnotationOp, levels: string[], options: ResolvedOptions): string {
  const capped = levels.slice(0, 2).map((level) => escapedText(level));
  const baseChars = Array.from(plainBase);
  const innerPos = positionForOp(op);
  const outerPos = positionForOp(opposite(op));
  const doubleClass = className(options, "ruby-double");

  if (capped.length === 2) {
    const raw1 = unescapeMarkup(levels[0]);
    const raw2 = unescapeMarkup(levels[1]);
    const ann1Parts = raw1.includes(" ") ? splitBySpaces(raw1) : null;
    const ann2Parts = raw2.includes(" ") ? splitBySpaces(raw2) : null;
    const can1Align = ann1Parts !== null && ann1Parts.length === baseChars.length;
    const can2Align = ann2Parts !== null && ann2Parts.length === baseChars.length;

    if (can1Align && can2Align) {
      return baseChars
        .map((char, i) => {
          const base = escapeHtml(char);
          const a1 = ann1Parts![i];
          const a2 = ann2Parts![i];
          const hide1 = shouldHideAnnotation(char, a1);
          const hide2 = shouldHideAnnotation(char, a2);
          if (hide1 && hide2) return renderEmptyRuby(base, innerPos, options);
          if (hide1) return renderRubyElement(base, escapeHtml(a2), outerPos, options);
          if (hide2) return renderRubyElement(base, escapeHtml(a1), innerPos, options);
          const inner = renderRubyElement(base, escapeHtml(a1), innerPos, options);
          return renderRubyElement(inner, escapeHtml(a2), outerPos, options, doubleClass);
        })
        .join("");
    }

    if (can1Align) {
      const inner = baseChars
        .map((char, i) => {
          const base = escapeHtml(char);
          const ann = ann1Parts![i];
          return shouldHideAnnotation(char, ann)
            ? renderEmptyRuby(base, innerPos, options)
            : renderRubyElement(base, escapeHtml(ann), innerPos, options);
        })
        .join("");
      return renderRubyElement(inner, capped[1], outerPos, options, doubleClass);
    }

    if (can2Align) {
      const inner = baseChars
        .map((char, i) => {
          const base = escapeHtml(char);
          const ann = ann2Parts![i];
          return shouldHideAnnotation(char, ann)
            ? renderEmptyRuby(base, outerPos, options)
            : renderRubyElement(base, escapeHtml(ann), outerPos, options);
        })
        .join("");
      return renderRubyElement(inner, capped[0], innerPos, options, doubleClass);
    }

    const inner = renderRubyElement(baseHtml, capped[0], innerPos, options);
    return renderRubyElement(inner, capped[1], outerPos, options, doubleClass);
  }

  if (capped.length === 1) {
    const raw = unescapeMarkup(levels[0]);
    if (raw.includes(" ")) {
      const parts = splitBySpaces(raw);
      if (parts.length === baseChars.length) {
        return baseChars
          .map((char, i) => {
            const base = escapeHtml(char);
            const ann = parts[i];
            return shouldHideAnnotation(char, ann)
              ? renderEmptyRuby(base, innerPos, options)
              : renderRubyElement(base, escapeHtml(ann), innerPos, options);
          })
          .join("");
      }
    }
    return renderRubyElement(baseHtml, capped[0], innerPos, options);
  }

  return baseHtml;
}

function underlinePattern(pattern: string, op: AnnotationOp): UnderlineStyle | null {
  if (op !== "^_") return null;
  return UNDERLINE_STYLES[unescapeMarkup(pattern)] ?? null;
}

function sourceBase(source: string): string {
  if (source[0] === "[") {
    const close = findBracketClose(source, 0, source.length);
    return close > 0 ? source.slice(1, close) : "";
  }

  for (let i = 0; i < source.length; i++) {
    if (opAt(source, i, source.length)) return source.slice(0, i);
  }

  return "";
}

function stripInlineAnnotationMarkup(input: string, options: ResolvedOptions): string {
  let plain = "";
  let pos = 0;

  while (pos < input.length) {
    const match = findInlineAnnotation(input, pos, input.length, options);
    if (!match) {
      plain += unescapeMarkup(input.slice(pos));
      break;
    }
    plain += unescapeMarkup(input.slice(pos, match.start));
    plain += stripInlineAnnotationMarkup(sourceBase(match.source), options);
    pos = match.end;
  }

  return plain;
}

function renderAnnotation(baseRaw: string, op: AnnotationOp, annRaw: string, op2: AnnotationOp | null, annRaw2: string | null, options: ResolvedOptions): string {
  const baseHtml = renderInlineAnnotationsToHtml(baseRaw, options);
  const plainBase = hasInlineAnnotation(baseRaw) ? "" : stripInlineAnnotationMarkup(baseRaw, options);
  const levels = splitByUnescapedPipe(annRaw);

  if (annRaw2 !== null && op2 !== null && levels.length === 1) {
    const outerSpecial = unescapeMarkup(annRaw);
    const innerSpecial = unescapeMarkup(annRaw2);
    const outerUnderline = underlinePattern(outerSpecial, op);
    const innerUnderline = underlinePattern(innerSpecial, op2);
    const outerBouten = outerSpecial === BOUTEN_PATTERN;
    const innerBouten = innerSpecial === BOUTEN_PATTERN;

    if (outerBouten && innerBouten) return renderBoutenBoth(baseHtml, options);
    if (outerBouten && innerUnderline) {
      return `<span class="${className(options, "bouten")} ${className(options, "bouten-over")} ${underlineClass(options, innerUnderline)}"${attrStyle(`${STYLE_BOUTEN_OVER};${underlineStyle(innerUnderline)}`, options)}>${baseHtml}</span>`;
    }
    if (outerUnderline && innerBouten) {
      return `<span class="${className(options, "bouten")} ${className(options, "bouten-over")} ${underlineClass(options, outerUnderline)}"${attrStyle(`${STYLE_BOUTEN_OVER};${underlineStyle(outerUnderline)}`, options)}>${baseHtml}</span>`;
    }
    if (outerBouten) {
      return renderRubyWithDecoration(baseHtml, escapedText(annRaw2), op2, op, "bouten", null, options);
    }
    if (innerBouten) {
      return renderRubyWithDecoration(baseHtml, escapedText(annRaw), op, op2, "bouten", null, options);
    }
    if (outerUnderline) {
      return renderRubyWithDecoration(baseHtml, escapedText(annRaw2), op2, op, "underline", outerUnderline, options);
    }
    if (innerUnderline) {
      return renderRubyWithDecoration(baseHtml, escapedText(annRaw), op, op2, "underline", innerUnderline, options);
    }

    return renderRubyLevels(baseHtml, plainBase, op, [annRaw, annRaw2], options);
  }

  if (levels.length >= 2) {
    const first = unescapeMarkup(levels[0]);
    const second = unescapeMarkup(levels[1]);
    const firstBouten = first === BOUTEN_PATTERN;
    const secondBouten = second === BOUTEN_PATTERN;
    const firstUnderline = underlinePattern(first, op);
    const secondUnderline = underlinePattern(second, opposite(op));

    if (firstBouten && secondBouten) return renderBoutenBoth(baseHtml, options);
    if (firstBouten && secondUnderline) {
      return `<span class="${className(options, "bouten")} ${className(options, `bouten-${positionForOp(op)}`)} ${underlineClass(options, secondUnderline)}"${attrStyle(`${boutenStyle(positionForOp(op))};${underlineStyle(secondUnderline)}`, options)}>${baseHtml}</span>`;
    }
    if (secondBouten && firstUnderline) {
      return `<span class="${className(options, "bouten")} ${className(options, `bouten-${positionForOp(opposite(op))}`)} ${underlineClass(options, firstUnderline)}"${attrStyle(`${boutenStyle(positionForOp(opposite(op)))};${underlineStyle(firstUnderline)}`, options)}>${baseHtml}</span>`;
    }
    if (firstBouten) {
      return renderRubyWithDecoration(baseHtml, escapedText(levels[1]), opposite(op), op, "bouten", null, options);
    }
    if (secondBouten) {
      return renderRubyWithDecoration(baseHtml, escapedText(levels[0]), op, opposite(op), "bouten", null, options);
    }
    if (firstUnderline) {
      return renderRubyWithDecoration(baseHtml, escapedText(levels[1]), opposite(op), op, "underline", firstUnderline, options);
    }
    if (secondUnderline) {
      return renderRubyWithDecoration(baseHtml, escapedText(levels[0]), op, opposite(op), "underline", secondUnderline, options);
    }
  }

  const only = unescapeMarkup(levels[0] ?? "");
  if (only === BOUTEN_PATTERN) return renderBouten(baseHtml, positionForOp(op), options);
  const underline = underlinePattern(only, op);
  if (underline) return renderUnderline(baseHtml, underline, options);

  return renderRubyLevels(baseHtml, plainBase, op, levels, options);
}

function parseBracketedAt(input: string, start: number, max: number, options: ResolvedOptions): InlineAnnotationMatch | null {
  if (input[start] !== "[" || isEscaped(input, start)) return null;
  const close = findBracketClose(input, start, max);
  if (close < 0) return null;
  const op = opAt(input, close + 1, max);
  if (!op) return null;
  const annStart = close + 4;
  const annEnd = findCloseParen(input, annStart, max);
  if (annEnd < 0 || annEnd === annStart) return null;

  let end = annEnd + 1;
  let op2: AnnotationOp | null = null;
  let ann2: string | null = null;
  const nextOp = opAt(input, end, max);
  if (nextOp && nextOp !== op) {
    const secondStart = end + 3;
    const secondEnd = findCloseParen(input, secondStart, max);
    if (secondEnd >= 0 && secondEnd > secondStart) {
      op2 = nextOp;
      ann2 = input.slice(secondStart, secondEnd);
      end = secondEnd + 1;
    }
  }

  const ann = input.slice(annStart, annEnd);
  const source = input.slice(start, end);
  return {
    start,
    end,
    source,
    html: renderAnnotation(input.slice(start + 1, close), op, ann, op2, ann2, options),
  };
}

function isAbbreviatedBoundary(ch: string | undefined): boolean {
  return ch === undefined || /\s/.test(ch) || "[]()<>`*&!".includes(ch);
}

function parseAbbreviatedAt(input: string, start: number, max: number, options: ResolvedOptions): InlineAnnotationMatch | null {
  if (!options.enableAbbreviated || isAbbreviatedBoundary(input[start]) || input[start] === "^") return null;

  for (let i = start + 1; i < max; i++) {
    const op = opAt(input, i, max);
    if (op) {
      const base = input.slice(start, i);
      if (!base || /[\s[\]\n\r]/.test(base)) return null;
      const annStart = i + 3;
      const annEnd = findCloseParen(input, annStart, max);
      if (annEnd < 0 || annEnd === annStart) return null;

      let end = annEnd + 1;
      let op2: AnnotationOp | null = null;
      let ann2: string | null = null;
      const nextOp = opAt(input, end, max);
      if (nextOp && nextOp !== op) {
        const secondStart = end + 3;
        const secondEnd = findCloseParen(input, secondStart, max);
        if (secondEnd >= 0 && secondEnd > secondStart) {
          op2 = nextOp;
          ann2 = input.slice(secondStart, secondEnd);
          end = secondEnd + 1;
        }
      }

      const source = input.slice(start, end);
      return {
        start,
        end,
        source,
        html: renderAnnotation(base, op, input.slice(annStart, annEnd), op2, ann2, options),
      };
    }

    if (isAbbreviatedBoundary(input[i]) || input[i] === "^" || input[i] === "\n" || input[i] === "\r") return null;
  }

  return null;
}

function parseAt(input: string, start: number, max: number, options: ResolvedOptions): InlineAnnotationMatch | null {
  return parseBracketedAt(input, start, max, options) ?? parseAbbreviatedAt(input, start, max, options);
}

function isMarkdownBlocker(ch: string): boolean {
  return ch === "`" || ch === "*" || ch === "_" || ch === "<" || ch === "&" || ch === "!" || ch === "\n" || ch === "\r";
}

function findInlineAnnotationIn(
  input: string,
  start: number,
  max: number,
  rawOptions: InlineAnnotationOptions | undefined,
  stopBeforeMarkdown: boolean
): InlineAnnotationMatch | null {
  const options = resolveOptions(rawOptions);
  for (let i = start; i < max; i++) {
    const match = parseAt(input, i, max, options);
    if (match) return match;
    if (stopBeforeMarkdown && input[i] === "[" && !isEscaped(input, i)) return null;
    if (stopBeforeMarkdown && isMarkdownBlocker(input[i])) return null;
  }
  return null;
}

export function findInlineAnnotation(input: string, start = 0, max = input.length, rawOptions?: InlineAnnotationOptions): InlineAnnotationMatch | null {
  return findInlineAnnotationIn(input, start, max, rawOptions, false);
}

export function findInlineAnnotationBeforeMarkdown(input: string, start = 0, max = input.length, rawOptions?: InlineAnnotationOptions): InlineAnnotationMatch | null {
  return findInlineAnnotationIn(input, start, max, rawOptions, true);
}

export function renderInlineAnnotationsToHtml(input: string, rawOptions?: InlineAnnotationOptions): string {
  const options = resolveOptions(rawOptions);
  let html = "";
  let pos = 0;

  while (pos < input.length) {
    const match = findInlineAnnotation(input, pos, input.length, options);
    if (!match) {
      html += escapedText(input.slice(pos));
      break;
    }
    html += escapedText(input.slice(pos, match.start));
    html += match.html;
    pos = match.end;
  }

  return html;
}

export function hasInlineAnnotation(input: string): boolean {
  return input.includes("^^(") || input.includes("^_(");
}

export const inlineAnnotationDefaults = DEFAULT_OPTIONS;
