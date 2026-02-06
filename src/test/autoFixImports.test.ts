import { describe, it, expect } from "vitest";
import { detectMissingLucideImports, autoFixMissingImports } from "@/lib/autoFixImports";

describe("detectMissingLucideImports", () => {
  it("detects missing lucide icons used in JSX", () => {
    const code = `
const MyComponent = () => (
  <div>
    <Bot size={24} />
    <Send />
    <ChevronDown className="w-4" />
  </div>
);`;
    const missing = detectMissingLucideImports(code);
    expect(missing).toEqual(["Bot", "ChevronDown", "Send"]);
  });

  it("ignores already imported icons", () => {
    const code = `
import { Bot, Send } from 'lucide-react';

const MyComponent = () => (
  <div>
    <Bot size={24} />
    <Send />
    <ChevronDown />
  </div>
);`;
    const missing = detectMissingLucideImports(code);
    expect(missing).toEqual(["ChevronDown"]);
  });

  it("ignores locally defined components", () => {
    const code = `
const MyCard = () => <div />;
const MyComponent = () => (
  <div>
    <MyCard />
    <Bot />
  </div>
);`;
    const missing = detectMissingLucideImports(code);
    expect(missing).toEqual(["Bot"]);
  });

  it("ignores non-lucide PascalCase components", () => {
    const code = `
const MyComponent = () => (
  <div>
    <Header />
    <Footer />
    <App />
    <Bot />
  </div>
);`;
    const missing = detectMissingLucideImports(code);
    expect(missing).toEqual(["Bot"]);
  });

  it("returns empty array when all icons are imported", () => {
    const code = `
import { Bot, Send } from 'lucide-react';
const X = () => <div><Bot /><Send /></div>;`;
    expect(detectMissingLucideImports(code)).toEqual([]);
  });

  it("returns empty array for code with no JSX icons", () => {
    const code = `const x = 42; console.log(x);`;
    expect(detectMissingLucideImports(code)).toEqual([]);
  });
});

describe("autoFixMissingImports", () => {
  it("prepends import statement for missing icons", () => {
    const code = `const X = () => <Bot size={24} />;`;
    const fixed = autoFixMissingImports(code);
    expect(fixed).toContain("import { Bot } from 'lucide-react'");
    expect(fixed).toContain("const X = () => <Bot size={24} />;");
  });

  it("extends existing lucide-react import", () => {
    const code = `import { Send } from 'lucide-react';
const X = () => <div><Send /><Bot /><Star /></div>;`;
    const fixed = autoFixMissingImports(code);
    expect(fixed).toContain("Bot");
    expect(fixed).toContain("Send");
    expect(fixed).toContain("Star");
    // Should be one combined import, not two separate ones
    const importCount = (fixed.match(/from 'lucide-react'/g) || []).length;
    expect(importCount).toBe(1);
  });

  it("does not modify code with no missing imports", () => {
    const code = `import { Bot } from 'lucide-react';
const X = () => <Bot />;`;
    expect(autoFixMissingImports(code)).toBe(code);
  });
});
