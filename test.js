const assert = require("node:assert/strict");
const MarkdownIt = require("markdown-it");
const {
  inlineAnnotationPlugin,
  renderInlineAnnotationsToHtml,
  findInlineAnnotation,
} = require("./dist/index.js");

function md(options) {
  return new MarkdownIt().use(inlineAnnotationPlugin, options);
}

function inline(input, options) {
  return md(options).render(input).trim().replace(/^<p>/, "").replace(/<\/p>$/, "");
}

const tests = [];
function test(name, fn) {
  tests.push([name, fn]);
}

function hasAll(value, parts) {
  for (const part of parts) assert.ok(value.includes(part), `Missing ${part} in ${value}`);
}

test("basic bracketed over ruby", () => {
  const html = inline("[漢字]^^(かんじ)");
  hasAll(html, ['<ruby class="ia-ruby ia-ruby-over"', "漢字", "<rt>かんじ</rt>"]);
});

test("basic bracketed under ruby", () => {
  const html = inline("[base]^_(ann)");
  hasAll(html, ['<ruby class="ia-ruby ia-ruby-under"', 'style="ruby-position:under"', "<rt>ann</rt>"]);
});

test("abbreviated ruby", () => {
  const html = inline("東京^^(とうきょう)");
  hasAll(html, ["東京", "<rt>とうきょう</rt>"]);
});

test("multiple annotations in one paragraph", () => {
  const html = inline("[東]^^(ひがし)[京]^^(きょう)");
  hasAll(html, ["<rt>ひがし</rt>", "<rt>きょう</rt>"]);
  assert.equal((html.match(/<ruby/g) || []).length, 2);
});

test("two-slot pipe annotation", () => {
  const html = inline("[北京]^^(ペキン|Beijing)");
  hasAll(html, ["ia-ruby-double", "<rt>ペキン</rt>", "<rt>Beijing</rt>"]);
});

test("mixed chaining annotation", () => {
  const html = inline("[base]^^(over)^_(under)");
  hasAll(html, ["ia-ruby-double", "<rt>over</rt>", "<rt>under</rt>"]);
});

test("reverse chained annotation is position-driven", () => {
  const html = inline("[base]^_(under)^^(over)");
  hasAll(html, ["ia-ruby-double", "<rt>over</rt>", "<rt>under</rt>"]);
});

test("same-operator chain is not merged", () => {
  const html = inline("[base]^^(a)^^(b)");
  assert.ok(!html.includes("ia-ruby-double"));
  assert.ok(html.includes("^^(b)"));
});

test("bouten over", () => {
  const html = inline("[漢字]^^(..)");
  hasAll(html, ['<span class="ia-bouten ia-bouten-over"', "text-emphasis:filled dot", "漢字"]);
});

test("bouten both slots", () => {
  const html = inline("[漢字]^^(..)^_(..)");
  hasAll(html, ["ia-bouten-over", "ia-bouten-under"]);
});

test("underline variants", () => {
  hasAll(inline("[base]^_(.-)"), ['<span class="ia-underline"', "text-decoration-line:underline"]);
  hasAll(inline("[base]^_(.~)"), ["ia-underline-wavy", "text-decoration-style:wavy"]);
  hasAll(inline("[base]^_(.=)"), ["ia-underline-double", "text-decoration-style:double"]);
});

test("ruby plus underline through pipe notation", () => {
  const html = inline("[重要語句]^^(じゅうようごく|.-)");
  hasAll(html, ["ia-ruby-mixed", "ia-underline", "<rt>じゅうようごく</rt>"]);
});

test("bouten plus wavy underline through chaining", () => {
  const html = inline("[強調]^^(..)^_(.~)");
  hasAll(html, ["ia-bouten-over", "ia-underline-wavy", "text-decoration-style:wavy"]);
});

test("over-slot underline pattern is ruby text", () => {
  const html = inline("[base]^^(.-)");
  hasAll(html, ["<ruby", "<rt>.-</rt>"]);
  assert.ok(!html.includes("ia-underline"));
});

test("per-character alignment", () => {
  const html = inline("[春夏秋冬]^^(はる なつ あき ふゆ)");
  hasAll(html, ["<rt>はる</rt>", "<rt>なつ</rt>", "<rt>あき</rt>", "<rt>ふゆ</rt>"]);
  assert.equal((html.match(/<ruby/g) || []).length, 4);
});

test("two-level per-character alignment", () => {
  const html = inline("[李太白]^^(Lǐ Tài Bái|ㄌㄧˇ ㄊㄞˋ ㄅㄞˊ)");
  hasAll(html, ["<rt>Lǐ</rt>", "<rt>Tài</rt>", "<rt>Bái</rt>", "<rt>ㄌㄧˇ</rt>", "<rt>ㄊㄞˋ</rt>", "<rt>ㄅㄞˊ</rt>"]);
  assert.equal((html.match(/ia-ruby-double/g) || []).length, 3);
});

test("auto-hide matching kana", () => {
  const html = inline("[振り仮名]^^(ふ り が な)");
  hasAll(html, ["<rt>ふ</rt>", "り<rp>(</rp><rt></rt>", "<rt>が</rt>", "<rt>な</rt>"]);
});

test("nested bracket span", () => {
  const html = inline("[[護]^^(まも)れ]^_(プロテゴ)");
  hasAll(html, ["<rt>まも</rt>", "<rt>プロテゴ</rt>", "れ"]);
});

test("nested title-style annotations", () => {
  const html = inline("[初音ミク^^(偉大なる|世界一姫様)]^_(Vocaloid)");
  hasAll(html, ["<rt>偉大なる</rt>", "<rt>世界一姫様</rt>", "<rt>Vocaloid</rt>"]);
});

test("nested bracket span does not discard inner annotation during alignment", () => {
  const html = inline("[[護]^^(まも)れ]^_(A B)");
  hasAll(html, ["<rt>まも</rt>", "<rt>A B</rt>", "れ"]);
});

test("pipe-saturated annotation consumes later opposite operator", () => {
  const html = inline("[李太白]^^(り たい はく|Lǐ Tài Bái)^_(..)");
  hasAll(html, ["<rt>り</rt>", "<rt>たい</rt>", "<rt>はく</rt>", "<rt>Lǐ</rt>", "<rt>Tài</rt>", "<rt>Bái</rt>"]);
  assert.ok(!html.includes("ia-bouten"));
  assert.ok(!html.includes("^_(..)"));
});

test("escaped pipe stays literal", () => {
  const html = inline("[A|B]^^(a\\|b)");
  hasAll(html, ["A|B", "<rt>a|b</rt>"]);
  assert.equal((html.match(/<rt>/g) || []).length, 1);
});

test("escaped close paren stays literal", () => {
  const html = inline("[x]^^(a\\)b)");
  hasAll(html, ["<rt>a)b</rt>"]);
});

test("language examples from Logseq demo", () => {
  hasAll(inline("H₂O^^(Hydrogen Dioxide)"), ["H₂O", "<rt>Hydrogen Dioxide</rt>"]);
  hasAll(inline("[Москва]^^(Moskva|Moscow)"), ["<rt>Moskva</rt>", "<rt>Moscow</rt>"]);
  hasAll(inline("[café]^^(ka.ˈfe|coffee)"), ["café", "<rt>ka.ˈfe</rt>", "<rt>coffee</rt>"]);
});

test("html is escaped in base and annotation", () => {
  assert.equal(
    renderInlineAnnotationsToHtml("[<script>]^^(<b>bold</b>)"),
    '<ruby class="ia-ruby ia-ruby-over" style="ruby-position:over">&lt;script&gt;<rp>(</rp><rt>&lt;b&gt;bold&lt;/b&gt;</rt><rp>)</rp></ruby>'
  );
});

test("nested double ruby pins inner over-position to avoid inheriting under", () => {
  const html = inline("[[護]^^(まも)れ]^_(プロテゴ)");
  hasAll(html, [
    '<ruby class="ia-ruby ia-ruby-under" style="ruby-position:under">',
    '<ruby class="ia-ruby ia-ruby-over" style="ruby-position:over">',
    "<rt>まも</rt>",
    "<rt>プロテゴ</rt>",
  ]);
});

test("per-character double ruby pins each inner over-position", () => {
  const html = inline("[李太白]^^(Lǐ Tài Bái|ㄌㄧˇ ㄊㄞˋ ㄅㄞˊ)");
  assert.equal((html.match(/ruby-position:over/g) || []).length, 3);
  assert.equal((html.match(/ruby-position:under/g) || []).length, 3);
});

test("code span is left to markdown-it", () => {
  const html = inline("`[a]^^(b)` [c]^^(d)");
  hasAll(html, ["<code>[a]^^(b)</code>", "<rt>d</rt>"]);
});

test("links are left to markdown-it", () => {
  const html = inline("[link](https://example.com) [漢字]^^(かんじ)");
  hasAll(html, ['<a href="https://example.com">link</a>', "<rt>かんじ</rt>"]);
});

test("core renderer can continue after non-annotation brackets", () => {
  const html = renderInlineAnnotationsToHtml("[link](url) [漢字]^^(かんじ)");
  hasAll(html, ["[link](url)", "<rt>かんじ</rt>"]);
});

test("emphasis still wraps annotation", () => {
  const html = inline("**[漢字]^^(かんじ)**");
  hasAll(html, ["<strong>", "<rt>かんじ</rt>", "</strong>"]);
});

test("custom options", () => {
  const html = inline("[漢字]^^(かんじ)", { classPrefix: "x", fallbackParens: "[]" });
  hasAll(html, ['<ruby class="x-ruby x-ruby-over"', "<rp>[</rp>", "<rp>]</rp>"]);
});

test("findInlineAnnotation returns source range", () => {
  const match = findInlineAnnotation("pre [漢字]^^(かんじ)", 0);
  assert.ok(match);
  assert.equal(match.start, 4);
  assert.equal(match.source, "[漢字]^^(かんじ)");
});

let passed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    passed++;
    console.log(`ok ${passed} - ${name}`);
  } catch (error) {
    console.error(`not ok ${passed + 1} - ${name}`);
    console.error(error);
    process.exit(1);
  }
}

console.log(`${passed} tests passed`);
