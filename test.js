const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const MarkdownIt = require("markdown-it");
const {
  inlineAnnotationPlugin,
  renderInlineAnnotationsToHtml,
  findInlineAnnotation,
} = require("./dist/index.js");
const htmlRenderFixtureCorpus = require("./fixtures/html-render.json");

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

function hasNone(value, parts) {
  for (const part of parts) assert.ok(!value.includes(part), `Unexpected ${part} in ${value}`);
}

test("shared fixture corpus is well formed", () => {
  assert.equal(htmlRenderFixtureCorpus.version, 1);
  assert.deepEqual(Object.keys(htmlRenderFixtureCorpus.fixtureTypes).sort(), [
    "host-skip",
    "rendering-policy",
    "semantic",
  ]);
  assert.ok(Array.isArray(htmlRenderFixtureCorpus.cases));
  const ids = new Set();
  const allowedAssertionTypes = new Set(Object.keys(htmlRenderFixtureCorpus.fixtureTypes));
  for (const fixture of htmlRenderFixtureCorpus.cases) {
    assert.ok(fixture.id, "fixture id is required");
    assert.ok(!ids.has(fixture.id), `duplicate fixture id ${fixture.id}`);
    ids.add(fixture.id);
    assert.ok(fixture.category, `fixture ${fixture.id} category is required`);
    assert.ok(
      allowedAssertionTypes.has(fixture.assertionType),
      `fixture ${fixture.id} assertionType must be one of ${[...allowedAssertionTypes].join(", ")}`
    );
    if (fixture.assertionType === "rendering-policy") {
      assert.ok(fixture.options, `fixture ${fixture.id} must declare renderer options`);
    }
    if (fixture.assertionType === "host-skip") {
      assert.ok(
        Array.isArray(fixture.hostSkip) && fixture.hostSkip.length > 0,
        `fixture ${fixture.id} must declare hostSkip`
      );
    }
    assert.ok(fixture.name, `fixture ${fixture.id} name is required`);
    assert.ok(typeof fixture.input === "string", `fixture ${fixture.id} input must be a string`);
    assert.ok(
      (fixture.contains && fixture.contains.length > 0) ||
        (fixture.notContains && fixture.notContains.length > 0) ||
        (fixture.counts && fixture.counts.length > 0),
      `fixture ${fixture.id} needs at least one assertion`
    );
    for (const count of fixture.counts || []) {
      assert.ok(count.pattern, `fixture ${fixture.id} count pattern is required`);
      assert.ok(Number.isInteger(count.count) && count.count >= 0, `fixture ${fixture.id} count must be a non-negative integer`);
    }
  }
});

for (const fixture of htmlRenderFixtureCorpus.cases) {
  test(`shared fixture ${fixture.id}: ${fixture.name}`, () => {
    const html = inline(fixture.input, fixture.options);
    hasAll(html, fixture.contains || []);
    hasNone(html, fixture.notContains || []);
    for (const count of fixture.counts || []) {
      assert.equal(
        html.split(count.pattern).length - 1,
        count.count,
        `Expected ${count.pattern} count ${count.count} in ${html}`
      );
    }
  });
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

test("over-slot line mark is an overline", () => {
  const html = inline("[base]^^(.-)");
  hasAll(html, ['<span class="ia-overline"', "text-decoration-line:overline"]);
  hasNone(html, ["<ruby", "ia-underline"]);
});

test("overline variants", () => {
  hasAll(inline("[base]^^(.~)"), ["ia-overline-wavy", "text-decoration-style:wavy"]);
  hasAll(inline("[base]^^(.=)"), ["ia-overline-double", "text-decoration-style:double"]);
});

test("overline above plus underline below", () => {
  const html = inline("[base]^^(.-)^_(.~)");
  hasAll(html, ["ia-overline", "ia-underline ia-underline-wavy", "text-decoration-line:overline"]);
  hasNone(html, ["<ruby"]);
});

test("escaped over-slot mark stays ruby text", () => {
  const html = inline("[base]^^(\\.-)");
  hasAll(html, ["<ruby", "<rt>.-</rt>"]);
  hasNone(html, ["ia-overline"]);
});

test("per-character alignment", () => {
  const html = inline("[春夏秋冬]^^(はる なつ あき ふゆ)");
  hasAll(html, ["<rt>はる</rt>", "<rt>なつ</rt>", "<rt>あき</rt>", "<rt>ふゆ</rt>"]);
  assert.equal((html.match(/<ruby/g) || []).length, 4);
});

test("space alignment can be disabled", () => {
  const html = inline("[真值]^^(Truth Value)", { enableSpaceAlignment: false });
  hasAll(html, ["真值", "<rt>Truth Value</rt>"]);
  assert.equal((html.match(/<rt>/g) || []).length, 1);
});

test("space alignment can be set to off", () => {
  const html = inline("[春夏秋冬]^^(はる なつ あき ふゆ)", { spaceAlignment: "off" });
  hasAll(html, ["春夏秋冬", "<rt>はる なつ あき ふゆ</rt>"]);
  assert.equal((html.match(/<rt>/g) || []).length, 1);
});

test("auto space alignment keeps plain ASCII glosses grouped", () => {
  const html = inline("[真值]^^(Truth Value)", { spaceAlignment: "auto" });
  hasAll(html, ["真值", "<rt>Truth Value</rt>"]);
  assert.equal((html.match(/<rt>/g) || []).length, 1);
});

test("auto space alignment keeps phonetic readings per character", () => {
  const html = inline("[取り返す]^^(と り かえ す)", { spaceAlignment: "auto" });
  hasAll(html, ["<rt>と</rt>", "り<rp>(</rp><rt></rt>", "<rt>かえ</rt>", "す<rp>(</rp><rt></rt>"]);
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

test("pipe-saturated annotation leaves later operator as text", () => {
  const html = inline("[李太白]^^(り たい はく|Lǐ Tài Bái)^_(..)");
  hasAll(html, ["<rt>り</rt>", "<rt>たい</rt>", "<rt>はく</rt>", "<rt>Lǐ</rt>", "<rt>Tài</rt>", "<rt>Bái</rt>"]);
  assert.ok(!html.includes("ia-bouten"));
  assert.ok(html.includes("^_(..)"));
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

test("package subpath exports expose core and fixtures", () => {
  const core = require("markdown-it-inline-annotation/core");
  const corpus = require("markdown-it-inline-annotation/fixtures/html-render.json");
  assert.equal(typeof core.renderInlineAnnotationsToHtml, "function");
  assert.equal(corpus.version, 1);
  assert.ok(corpus.cases.length > 0);
});

test("playground embeds fixture data without executable HTML sentinels", () => {
  const html = readFileSync("examples/playground.html", "utf8");
  assert.equal((html.match(/<\/script>/g) || []).length, 1);
  assert.ok(html.includes("\\u003cscript\\u003e"));
  assert.ok(html.includes("\\u003c/script\\u003e"));
  assert.ok(!html.includes('"[<img src=x>]^^(<script>x</script>)"'));
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
