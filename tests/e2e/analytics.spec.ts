import { test, expect, type Page } from "@playwright/test";

type Event = { event: string; properties: Record<string, unknown> };
const canonical = "https://doroboty-ai-nq8v.netlify.app";
const ingestion = "https://ingest.example.test";

async function collect(page: Page) {
  const events: Event[] = [];
  const requests: string[] = [];
  await page.route("**/*", async (route) => {
    const source = new URL(route.request().url());
    if (source.origin === canonical) {
      const response = await route.fetch({ url: `http://127.0.0.1:3126${source.pathname}` });
      await route.fulfill({ response });
      return;
    }
    requests.push(route.request().url());
    if (source.origin !== ingestion) {
      await route.abort();
      return;
    }
    const raw = route.request().postData();
    if (raw) {
      const body = JSON.parse(raw);
      events.push(...(Array.isArray(body) ? body : (body.batch ?? [body])));
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"status":1}' });
  });
  return { events, requests };
}

test("real SDK captures public pageviews and a sanitized click without persistent identity", async ({
  page,
}) => {
  const { events } = await collect(page);
  await page.goto(`${canonical}/?private=PRIVATE#/?secret=PRIVATE`);
  await expect.poll(() => events.filter((event) => event.event === "$pageview").length).toBe(1);
  await page.getByRole("link", { name: "Zobacz oferty", exact: true }).click();
  await expect.poll(() => events.filter((event) => event.event === "$autocapture").length).toBe(1);
  await expect.poll(() => events.filter((event) => event.event === "$pageview").length).toBe(2);
  const click = events.find((event) => event.event === "$autocapture")!;
  expect(click.properties.$current_url).toBe(`${canonical}/#/`);
  expect(click.properties.public_action).toBe("browse-jobs");
  expect(click.properties.$elements).toEqual([{ tag_name: "a", $el_text: "Zobacz oferty" }]);
  expect(JSON.stringify(events)).not.toContain("PRIVATE");
  expect(events.every((event) => event.properties.$process_person_profile === false)).toBe(true);
  expect(await page.context().cookies()).toEqual([]);
  expect(
    await page.evaluate(() =>
      [...Object.keys(localStorage), ...Object.keys(sessionStorage)].filter((key) =>
        key.startsWith("ph_"),
      ),
    ),
  ).toEqual([]);
});

test("private screens, forms, DOM contents and console errors produce no telemetry", async ({
  page,
}) => {
  const { events, requests } = await collect(page);
  await page.goto(`${canonical}/#/auth/sign-in`);
  await page.getByRole("button", { name: "Wejdź jako Anna Kowalska", exact: true }).click();
  await page.goto(`${canonical}/#/app/profil`);
  await page.getByLabel("Imię i nazwisko").fill("PRIVATE-PROFILE-CANARY");
  await page.getByRole("button", { name: "Zapisz profil", exact: true }).click();
  await page.evaluate(() => console.error("PRIVATE-CONSOLE-CANARY"));
  await page.goto(`${canonical}/#/oferty?q=PRIVATE-SEARCH-CANARY`);
  await page.getByRole("button", { name: "Szukaj", exact: true }).click();
  await expect.poll(() => events.length).toBe(1);
  await page.waitForTimeout(1500);
  expect(events.map((event) => event.event)).toEqual(["$pageview"]);
  expect(JSON.stringify(events)).not.toContain("PRIVATE");
  expect(requests.every((url) => /^\/(?:i\/v0\/)?e\/$/.test(new URL(url).pathname))).toBe(true);
});

test("analytics failure does not stop the prototype", async ({ page }) => {
  await collect(page);
  await page.route(`${ingestion}/**`, (route) => route.abort());
  await page.goto(canonical);
  await page.getByRole("link", { name: "Zobacz oferty", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Dobra robota. Z AI w środku.", exact: true }),
  ).toBeVisible();
});
