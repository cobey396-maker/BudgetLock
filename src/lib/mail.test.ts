import { strict as assert } from "node:assert";
import { test, describe } from "node:test";
import { passwordResetEmail, verifyEmail } from "./mail";

const RESET_URL = "https://budgetlock.app/reset?token=abc123";

describe("passwordResetEmail", () => {
  const mail = passwordResetEmail(RESET_URL, 60);

  test("carries the link in both the HTML and the plain-text part", () => {
    assert.ok(mail.html.includes(RESET_URL));
    assert.ok(mail.text.includes(RESET_URL));
  });

  test("states the expiry so the reader knows the link is time-limited", () => {
    assert.ok(mail.html.includes("60 minutes"));
    assert.ok(mail.text.includes("60 minutes"));
  });

  test("tells a recipient who did not request it that they can ignore it", () => {
    assert.ok(/didn't ask for this/i.test(mail.text));
    assert.ok(/didn't ask for this/i.test(mail.html));
  });

  test("shows the URL as text as well, for clients that strip buttons", () => {
    // The link appears twice: once as the anchor href, once as visible text.
    assert.ok(mail.html.split(RESET_URL).length - 1 >= 2);
  });
});

describe("verifyEmail", () => {
  test("carries the link in both parts", () => {
    const mail = verifyEmail("https://budgetlock.app/verify?token=xyz");
    assert.ok(mail.html.includes("https://budgetlock.app/verify?token=xyz"));
    assert.ok(mail.text.includes("https://budgetlock.app/verify?token=xyz"));
  });
});

describe("template escaping", () => {
  // A URL is the only caller-supplied value in these templates, but it reaches
  // an href, so it must not be able to close the attribute and inject markup.
  test("escapes quotes and angle brackets in the URL", () => {
    const nasty = 'https://x.test/reset?token="><script>alert(1)</script>';
    const html = passwordResetEmail(nasty, 60).html;
    assert.ok(!html.includes("<script>"), "raw script tag must not survive");
    assert.ok(html.includes("&quot;&gt;&lt;script&gt;"));
  });
});
