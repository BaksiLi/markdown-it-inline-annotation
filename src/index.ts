import type MarkdownIt from "markdown-it";
import {
  findInlineAnnotation,
  findInlineAnnotationBeforeMarkdown,
  hasInlineAnnotation,
  renderInlineAnnotationsToHtml,
  type InlineAnnotationOptions,
} from "./core";

export type MarkdownItInlineAnnotationOptions = InlineAnnotationOptions;

function pushText(state: any, content: string): void {
  if (!content) return;
  const token = state.push("text", "", 0);
  token.content = content;
}

function createInlineAnnotationRule(options: InlineAnnotationOptions) {
  return function inlineAnnotationRule(state: any, silent: boolean): boolean {
    const match = findInlineAnnotationBeforeMarkdown(state.src, state.pos, state.posMax, options);
    if (!match) return false;
    if (silent && match.start !== state.pos) return false;

    if (!silent) {
      pushText(state, state.src.slice(state.pos, match.start));
      const token = state.push("html_inline", "", 0);
      token.content = match.html;
      token.meta = { inlineAnnotationSource: match.source };
    }

    state.pos = match.end;
    return true;
  };
}

export function inlineAnnotationPlugin(md: MarkdownIt, options?: MarkdownItInlineAnnotationOptions): void {
  md.inline.ruler.before("text", "inline_annotation", createInlineAnnotationRule(options ?? {}));
}

export default inlineAnnotationPlugin;
export { inlineAnnotationPlugin as plugin };
export {
  findInlineAnnotation,
  findInlineAnnotationBeforeMarkdown,
  hasInlineAnnotation,
  inlineAnnotationDefaults,
  renderInlineAnnotationsToHtml,
  type InlineAnnotationOptions,
  type InlineAnnotationMatch,
  type AnnotationOp,
  type AnnotationPosition,
  type SpaceAlignmentPolicy,
  type UnderlineStyle,
} from "./core";
