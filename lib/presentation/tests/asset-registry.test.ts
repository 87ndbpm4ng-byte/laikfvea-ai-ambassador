import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { presentationAssetRegistry } from "@/lib/presentation/asset-registry";

test("every asset exposes stable presentation metadata", () => {
  for (const [id, asset] of Object.entries(presentationAssetRegistry)) {
    assert.equal(asset.id, id);
    assert.ok(asset.title);
    assert.ok(asset.category);
    assert.ok(asset.layout);
    assert.ok(asset.tags.length > 0);
    assert.ok(asset.media.src);
  }
});

test("presentation modules remain independent from backend systems", async () => {
  const files = [
    "../asset-registry.ts",
    "../presentation-manager.ts",
    "../presentation-rules.ts",
    "../presentation-types.ts",
  ];
  const source = (
    await Promise.all(
      files.map((file) => readFile(new URL(file, import.meta.url), "utf8")),
    )
  ).join("\n");

  assert.doesNotMatch(
    source,
    /liveavatar|elevenlabs|openai|orchestrator|retrieval|session-manager|api\//i,
  );
});
