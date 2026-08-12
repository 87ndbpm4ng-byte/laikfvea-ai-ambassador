import assert from "node:assert/strict";
import test from "node:test";
import { VisitorSessionLifecycle } from "@/lib/kiosk/visitor-session-lifecycle";

test("reset aborts and invalidates an in-flight visitor request", () => {
  const lifecycle = new VisitorSessionLifecycle();
  const request = lifecycle.beginRequest();

  lifecycle.reset();

  assert.equal(request.controller.signal.aborted, true);
  assert.equal(lifecycle.isCurrent(request.generation, request.controller), false);
  assert.equal(lifecycle.hasActiveRequest, false);
});

test("25 sequential visitors leave no active request or stale generation", () => {
  const lifecycle = new VisitorSessionLifecycle();

  for (let visitor = 0; visitor < 25; visitor += 1) {
    const first = lifecycle.beginRequest();
    assert.equal(lifecycle.isCurrent(first.generation, first.controller), true);

    if (visitor % 3 === 0) {
      const replacement = lifecycle.beginRequest();
      assert.equal(first.controller.signal.aborted, true);
      assert.equal(
        lifecycle.isCurrent(replacement.generation, replacement.controller),
        true,
      );
    }

    lifecycle.reset();
    assert.equal(lifecycle.hasActiveRequest, false);
    assert.equal(lifecycle.currentGeneration, visitor + 1);
  }
});
