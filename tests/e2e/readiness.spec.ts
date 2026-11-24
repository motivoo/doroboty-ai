import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { STORAGE_KEY } from "../../src/features/prototype/storage";

async function anna(page: Page) {
  await page.goto("/#/auth/sign-in");
  await page.getByRole("button", { name: "Wejdź jako Anna Kowalska", exact: true }).click();
  await expect(page.getByRole("link", { name: "Profil", exact: true })).toBeVisible();
}

test("failed import and reset never confirm success or replace the original scenario", async ({
  page,
}) => {
  await anna(page);
  await page.goto("/#/app/settings");
  const original = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  const imported = JSON.parse(original!);
  imported.people[0].name = "Nie powinno zostać zapisane";
  await page.evaluate(() => {
    Object.defineProperty(Storage.prototype, "setItem", {
      configurable: true,
      value() {
        throw new DOMException("Synthetic quota denial", "QuotaExceededError");
      },
    });
  });
  await page.getByLabel("Importuj plik scenariusza").setInputFiles({
    name: "scenario.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(imported)),
  });
  await page.getByRole("button", { name: "Importuj", exact: true }).click();
  await expect(page.getByText("Nie udało się zapisać importu.", { exact: false })).toBeVisible();
  await expect(page.getByText("Dane zostały zaimportowane.", { exact: true })).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(original);
  await page.getByRole("button", { name: "Resetuj scenariusz", exact: true }).click();
  await page.getByRole("button", { name: "Resetuj", exact: true }).click();
  await expect(page.getByText("Nie udało się zapisać resetu.", { exact: false })).toBeVisible();
  await expect(page.getByText("Przywrócono scenariusz początkowy.", { exact: true })).toHaveCount(
    0,
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(original);
  await page.reload();
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(original);
});

test("a second tab cannot overwrite the writer and can take over after it closes", async ({
  page,
  context,
}) => {
  await anna(page);
  const second = await context.newPage();
  await second.goto("/#/app/profil");
  await expect(
    second.getByText("Inna karta zapisuje ten scenariusz.", { exact: false }).first(),
  ).toBeVisible();
  await second.getByLabel("Imię i nazwisko").fill("Zmiana z drugiej karty");
  await second.getByRole("button", { name: "Zapisz profil", exact: true }).click();
  await expect(second.getByRole("alert")).toContainText("tylko do odczytu");
  expect(
    await second.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).people[0].name,
      STORAGE_KEY,
    ),
  ).toBe("Anna Kowalska");
  await second.goto("/#/app/settings");
  const exporting = second.waitForEvent("download");
  await second.getByRole("button", { name: "Eksportuj dane", exact: true }).click();
  expect((await exporting).suggestedFilename()).toBe("doroboty-scenariusz.json");
  await page.close();
  await second.reload();
  await second.goto("/#/app/profil");
  await second.getByLabel("Imię i nazwisko").fill("Anna po przejęciu zapisu");
  await second.getByRole("button", { name: "Zapisz profil", exact: true }).click();
  await second.reload();
  await expect(second.getByLabel("Imię i nazwisko")).toHaveValue("Anna po przejęciu zapisu");
});

test("unexpected external storage changes are not overwritten by an older tab", async ({
  page,
}) => {
  await anna(page);
  await page.goto("/#/app/profil");
  await page.evaluate((key) => {
    const newer = JSON.parse(localStorage.getItem(key)!);
    newer.people[0].name = "Nowszy zapis";
    localStorage.setItem(key, JSON.stringify(newer));
  }, STORAGE_KEY);
  await page.getByLabel("Imię i nazwisko").fill("Starsze pole formularza");
  await page.getByRole("button", { name: "Zapisz profil", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Nie nadpisano danych");
  await page.reload();
  await expect(page.getByLabel("Imię i nazwisko")).toHaveValue("Nowszy zapis");
});

test("unsupported writer locks keep the scenario read-only with export available", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "locks", { value: undefined });
  });
  await page.goto("/#/app/settings");
  await expect(
    page.getByText("Ta przeglądarka nie obsługuje bezpiecznego zapisu", { exact: false }),
  ).toBeVisible();
  const exporting = page.waitForEvent("download");
  await page.getByRole("button", { name: "Eksportuj dane", exact: true }).click();
  expect((await exporting).suggestedFilename()).toBe("doroboty-scenariusz.json");
  await page.getByRole("button", { name: "Resetuj scenariusz", exact: true }).click();
  await page.getByRole("button", { name: "Resetuj", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("nie obsługuje bezpiecznego zapisu");
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
});

test("an exported changed scenario restores byte-for-data in a separate browser context", async ({
  page,
  browser,
  baseURL,
}) => {
  await anna(page);
  await page.goto("/#/app/profil");
  await page.getByLabel("Imię i nazwisko").fill("Anna — odtworzony scenariusz");
  await page.getByRole("button", { name: "Zapisz profil", exact: true }).click();
  await page.goto("/#/oferty/staff-ai-engineer");
  await page.getByRole("button", { name: "Zapisz ofertę", exact: true }).click();
  const applicationId = await page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key)!).applications.find(
        (application: { candidateId: string; contribution?: unknown }) =>
          application.candidateId === "candidate-anna" && application.contribution,
      ).id as string,
    STORAGE_KEY,
  );
  await page.goto("/#/auth/sign-in");
  await page.getByRole("button", { name: "Wejdź jako Karolina Wiśniewska", exact: true }).click();
  await page.goto(`/#/app/kandydaci/${applicationId}`);
  await page
    .getByLabel("Notatka rekrutacyjna (widoczna pracodawcy)")
    .fill("Syntetyczna notatka próby odtworzenia.");
  await page.getByRole("button", { name: "W przeglądzie", exact: true }).click();
  await page.goto("/#/app/settings");
  const exporting = page.waitForEvent("download");
  await page.getByRole("button", { name: "Eksportuj dane", exact: true }).click();
  const download = await exporting;
  const data = await readFile((await download.path())!);
  const expected = JSON.parse(data.toString());
  expect(expected.saved.length).toBeGreaterThan(0);
  expect(JSON.stringify(expected.applications)).toContain("Syntetyczna notatka próby odtworzenia.");
  expect(expected.applications.some((a: { contribution?: unknown }) => a.contribution)).toBe(true);
  const isolated = await browser.newContext();
  try {
    const restored = await isolated.newPage();
    await restored.goto(`${baseURL}/#/app/settings`);
    await restored
      .getByLabel("Importuj plik scenariusza")
      .setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: data });
    await restored.getByRole("button", { name: "Importuj", exact: true }).click();
    await expect(restored.getByText("Dane zostały zaimportowane.", { exact: true })).toBeVisible();
    await restored.reload();
    expect(
      await restored.evaluate((key) => JSON.parse(localStorage.getItem(key)!), STORAGE_KEY),
    ).toEqual(expected);
  } finally {
    await isolated.close();
  }
});

test("demo context, company access and help remain usable at mobile and desktop sizes", async ({
  page,
}) => {
  await anna(page);
  for (const width of [1280, 850, 600, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/firmy/northstar-health");
    await expect(
      page.getByRole("complementary", { name: "Informacja o demonstracji" }),
    ).toContainText("wyłącznie dane syntetyczne");
    const save = page.getByRole("button", {
      name: "Zapisz ofertę: Staff AI Engineer",
      exact: true,
    });
    await expect(save).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  const before = await page
    .getByRole("button", { name: "Zapisz ofertę: Staff AI Engineer", exact: true })
    .getAttribute("aria-pressed");
  await page.getByRole("button", { name: "Zapisz ofertę: Staff AI Engineer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Zapisz ofertę: Staff AI Engineer", exact: true }),
  ).toHaveAttribute("aria-pressed", before === "true" ? "false" : "true");
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations,
  ).toEqual([]);
  await page.getByRole("link", { name: "Pomoc i odzyskiwanie danych", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Pomoc i odzyskiwanie danych", exact: true }),
  ).toBeVisible();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Pobierz opis do zgłoszenia", exact: true }).click();
  const diagnostic = await readFile((await (await downloading).path())!, "utf8");
  expect(diagnostic).toContain("sha256:");
  expect(diagnostic).not.toContain("Anna Kowalska");
  expect(diagnostic).not.toContain("northstar-health");
  await page.screenshot({ path: "artifacts/readiness-help-mobile.png", fullPage: true });
});

test("render failure offers original-save recovery and diagnostics without exception contents", async ({
  page,
}) => {
  await anna(page);
  const original = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  await page.evaluate(() => {
    Object.defineProperty(Intl, "DateTimeFormat", {
      value: function () {
        throw new Error("SYNTHETIC-PRIVATE-ERROR-CANARY");
      },
    });
  });
  await page.goto("/#/oferty");
  await expect(
    page.getByRole("heading", { name: "Nie udało się wyświetlić prototypu", exact: true }),
  ).toBeVisible();
  const savingOriginal = page.waitForEvent("download");
  await page.getByRole("button", { name: "Pobierz zapis do odzyskania", exact: true }).click();
  expect(await readFile((await (await savingOriginal).path())!, "utf8")).toBe(original);
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Pobierz opis do zgłoszenia", exact: true }).click();
  const diagnostic = await readFile((await (await downloading).path())!, "utf8");
  expect(diagnostic).toContain("ui-render-failure");
  expect(diagnostic).not.toContain("SYNTHETIC-PRIVATE-ERROR-CANARY");
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(page.locator(".prototype-recovery")).toHaveCount(1);
  for (const button of await page.locator(".recovery-actions button").all()) {
    const box = await button.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(18);
    expect(box!.x + box!.width).toBeLessThanOrEqual(302);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/readiness-recovery-mobile.png", fullPage: true });
});
