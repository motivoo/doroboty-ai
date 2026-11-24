import { test, expect } from "@playwright/test";
import { initialState } from "../../src/features/prototype/model";
import { STORAGE_KEY } from "../../src/features/prototype/storage";

const cardId = "b14dfee5-3b0b-4ecb-b8f3-a342d1926bfa";
const emptyId = "application-anna-ai-operations-example";

test("independent fresh browsers can open Anna's approved card and the add-card example", async ({
  browser,
  baseURL,
}) => {
  for (const session of ["first", "second"]) {
    const context = await browser.newContext({ baseURL });
    try {
      const page = await context.newPage();
      await page.goto("/#/auth/sign-in");
      await page
        .getByRole("button", { name: "Wejdź jako Karolina Wiśniewska", exact: true })
        .click();
      await page.goto("/#/app/kandydaci");
      const complete = page
        .locator("article")
        .filter({ has: page.getByRole("link", { name: "Anna Kowalska", exact: true }) })
        .filter({ hasText: "AI Product Manager" });
      await expect(complete).toContainText("Karta projektu: Dostępna");
      await expect(complete).toContainText("wersja 2");
      await page.goto(`/#/app/kandydaci/${cardId}/projekt`);
      await page.reload();
      await expect(page.getByRole("heading", { name: "Anna Kowalska", exact: true })).toBeVisible();
      await expect(
        page.getByText("AI Product Manager · BrightLabs · karta, wersja 2", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("To przykład demonstracyjny przygotowany do testu prototypu.", {
          exact: false,
        }),
      ).toHaveCount(0);
      await expect(page.getByRole("button", { name: /^Zobacz materiał:/ })).toHaveCount(4);
      await page.screenshot({
        path: `artifacts/prepared-examples/${session}-recruiter.png`,
        fullPage: false,
      });
      await page.getByRole("link", { name: "Zmień osobę", exact: true }).click();
      await page.getByRole("button", { name: "Wejdź jako Anna Kowalska", exact: true }).click();
      await page.goto(`/#/app/aplikacje/${emptyId}`);
      await expect(page.getByRole("link", { name: "Dodaj projekt", exact: true })).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "AI Operations Specialist", exact: true }),
      ).toBeVisible();
      await page.getByRole("link", { name: "Dodaj projekt", exact: true }).click();
      await expect(page.getByLabel("Nazwa projektu", { exact: true })).toHaveValue("");
      await expect(page.getByLabel("Za co odpowiadałeś osobiście?", { exact: true })).toHaveValue(
        "",
      );
    } finally {
      await context.close();
    }
  }
});

test("an older browser receives the prepared examples without a reset", async ({ page }) => {
  const legacy = initialState();
  delete legacy.preparedExamplesVersion;
  legacy.applications = legacy.applications.filter(
    (application) => application.candidateId !== "candidate-anna",
  );
  legacy.activePersonId = "employer-brightlabs";
  legacy.applications[0].answer = "Existing answer survives the prepared-example upgrade.";
  await page.addInitScript(
    ({ key, state }) => {
      if (!sessionStorage.getItem("legacy-seeded")) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem("legacy-seeded", "1");
      }
    },
    { key: STORAGE_KEY, state: legacy },
  );
  await page.goto("/#/app/kandydaci");
  await expect(page.getByRole("link", { name: "Anna Kowalska", exact: true })).toHaveCount(2);
  await page.goto("/#/app/settings");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Eksportuj dane", exact: true }).click();
  const exported = await download;
  const { readFile } = await import("node:fs/promises");
  const saved = JSON.parse(await readFile((await exported.path())!, "utf8"));
  expect(saved.applications[0]).toEqual(legacy.applications[0]);
  expect(saved.activePersonId).toBe("employer-brightlabs");
  expect(saved.preparedExamplesVersion).toBe(1);
});

test("an explicit legacy import is authoritative across reloads", async ({ page }) => {
  const imported = initialState();
  delete imported.preparedExamplesVersion;
  imported.applications = imported.applications.filter(
    (application) => application.candidateId !== "candidate-anna",
  );
  imported.activePersonId = "employer-brightlabs";
  await page.goto("/#/auth/sign-in");
  await page.getByRole("button", { name: "Wejdź jako Karolina Wiśniewska", exact: true }).click();
  await page.goto("/#/app/settings");
  await page.getByLabel("Importuj plik scenariusza").setInputFiles({
    name: "legacy.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(imported)),
  });
  await page.getByRole("button", { name: "Importuj", exact: true }).click();
  await page.reload();
  await page.goto("/#/app/kandydaci");
  await expect(page.getByRole("link", { name: "Anna Kowalska", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Marek Nowak", exact: true })).toBeVisible();
});
