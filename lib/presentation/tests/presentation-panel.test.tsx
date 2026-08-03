import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PresentationPanel } from "@/components/presentation/presentation-panel";

test("panel appears for a registered presentation", () => {
  const markup = renderToStaticMarkup(
    <PresentationPanel
      presentation={{ type: "feature", asset: "charging" }}
    />,
  );

  assert.match(markup, /presentation-panel/);
  assert.match(markup, /Now showing: Charging/);
  assert.match(markup, /%2Fpresenter%2Fcharging\.png/);
});

test("panel collapses completely for a null presentation", () => {
  assert.equal(renderToStaticMarkup(<PresentationPanel presentation={null} />), "");
});

test("responsive rules place the panel beside or above the conversation", async () => {
  const css = await readFile(
    new URL("../../../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(
    css,
    /conversation-response-presentation:has\(\.presentation-panel\)[^{]*\{[^}]*grid-template-columns:\s*minmax\(0, 1\.15fr\) minmax\(13rem, 0\.85fr\)/s,
  );
  assert.match(
    css,
    /@media \(orientation: portrait\), \(max-width: 63\.999rem\)[^{]*\{[\s\S]*?\.presentation-panel\s*\{[^}]*grid-row:\s*1/s,
  );
});
