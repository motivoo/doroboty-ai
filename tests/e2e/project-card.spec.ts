import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { initialState, transition, type State } from "../../src/features/prototype/model";
import { emptyProject } from "../../src/features/prototype/project-card-model";
import { STORAGE_KEY } from "../../src/features/prototype/storage";

const appId = "application-example";
const time = "2026-11-20T14:00:00.000Z";
function sharedState() {
  let state = transition(initialState(), { type: "select_person", id: "candidate-marek" });
  state = transition(
    state,
    {
      type: "project_draft",
      applicationId: appId,
      content: {
        ...emptyProject(),
        name: "Wyszukiwarka procedur",
        problem: "Odnajdywanie procedur w dokumentach.",
        own: "Indeksowanie i testy.",
        teamMode: "description",
        team: "Inna osoba przygotowała API.",
        decisionMode: "none",
        resultMode: "unknown",
        availability: "yes",
        materials: [
          {
            id: "example-source",
            name: "Opis podziału pracy",
            kind: "excerpt",
            value: "Kandydat: indeksowanie i testy. Zespół: API.",
            location: "Akapit 1",
            target: "own",
            shows: "Deklarowany zakres własny i zespołu",
            support: "Nie podano",
          },
        ],
      },
    },
    time,
  );
  state = transition(state, { type: "project_preview", applicationId: appId }, time);
  return transition(state, { type: "project_share", applicationId: appId, approved: true }, time);
}
async function seed(page: Page, state: State) {
  await page.addInitScript(
    ({ state, key }) => {
      if (!sessionStorage.getItem("project-test-seeded")) {
        localStorage.setItem(key, JSON.stringify(state));
        sessionStorage.setItem("project-test-seeded", "1");
      }
    },
    { state, key: STORAGE_KEY },
  );
}
async function person(page: Page, name: string) {
  await page.goto("/#/auth/sign-in");
  await page.getByRole("button", { name: `Wejdź jako ${name}`, exact: true }).click();
}
async function select(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}
test("candidate can save private unknown/solo draft, approve it, and prepare a separate next version", async ({
  page,
}) => {
  await person(page, "Marek Nowak");
  await page.goto(`/#/app/aplikacje/${appId}`);
  await page.getByRole("link", { name: "Dodaj projekt", exact: true }).click();
  await page.getByRole("button", { name: "Dalej: materiał" }).click();
  await expect(page.getByLabel("Nazwa projektu", { exact: true })).toBeFocused();
  await page.getByLabel("Nazwa projektu", { exact: true }).fill("Projekt samodzielny bez pomiaru");
  await page
    .getByLabel("Jaki problem rozwiązywaliście?", { exact: true })
    .fill("Odnajdywanie procedur.");
  await page
    .getByLabel("Za co odpowiadałeś osobiście?", { exact: true })
    .fill("Przygotowałem indeksowanie.");
  await select(page, "Co zrobiły inne osoby?", "Projekt samodzielny");
  await select(page, "Jaką decyzję podjąłeś i dlaczego?", "Nie potrafię wskazać osobnej decyzji");
  await select(page, "Jaki był rezultat?", "Nie znam rezultatu");
  await page.getByRole("button", { name: "Zapisz szkic", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Nazwa projektu", { exact: true })).toHaveValue(
    "Projekt samodzielny bez pomiaru",
  );
  await person(page, "Karolina Wiśniewska");
  await page.goto("/#/app/kandydaci");
  await expect(
    page
      .locator("article")
      .filter({ has: page.getByRole("link", { name: "Marek Nowak", exact: true }) })
      .getByText("Karta projektu: Nie dołączono", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Projekt samodzielny bez pomiaru")).toHaveCount(0);
  await person(page, "Marek Nowak");
  await page.goto(`/#/app/aplikacje/${appId}/projekt`);
  await page.getByRole("button", { name: "Dalej: materiał" }).click();
  await select(page, "Czy możesz pokazać materiał?", "Nie mogę udostępnić materiału");
  await page.getByRole("button", { name: "Przejdź do podglądu" }).click();
  const share = page.getByRole("button", { name: "Zatwierdź i udostępnij kartę" });
  await expect(share).toBeDisabled();
  await page
    .getByRole("checkbox", {
      name: "Sprawdziłem opis mojego wkładu i materiały przeznaczone do udostępnienia",
    })
    .check();
  await share.click();
  await expect(page).toHaveURL(/karta=1/);
  await expect(page.getByText(/Udostępniona wersja 1/)).toBeVisible();
  await page.getByRole("link", { name: "Edytuj", exact: true }).click();
  await page
    .getByLabel("Za co odpowiadałeś osobiście?", { exact: true })
    .fill("Nowy, jeszcze prywatny opis.");
  await person(page, "Karolina Wiśniewska");
  await page.goto(`/#/app/kandydaci/${appId}/projekt`);
  await expect(page.getByText("Przygotowałem indeksowanie.", { exact: true })).toBeVisible();
  await expect(page.getByText("Nowy, jeszcze prywatny opis.")).toHaveCount(0);
});

test("recruiter reads sources, retains notes across drawer/reload and saves an internal justified next step", async ({
  page,
}) => {
  await seed(page, transition(sharedState(), { type: "select_person", id: "employer-brightlabs" }));
  await page.goto(`/#/app/kandydaci/${appId}/projekt`);
  await page
    .getByLabel("Co według materiału kandydat zrobił osobiście?", { exact: true })
    .fill("Indeksowanie i testy.");
  const source = page.getByRole("button", {
    name: "Pokaż podstawę opisu: Własny wkład",
    exact: true,
  });
  await source.click();
  await expect(page.getByRole("dialog")).toContainText(
    "Kandydat: indeksowanie i testy. Zespół: API.",
  );
  await page.getByRole("button", { name: "Zamknij", exact: true }).press("Escape");
  await expect(source).toBeFocused();
  await page.reload();
  await expect(
    page.getByLabel("Co według materiału kandydat zrobił osobiście?", { exact: true }),
  ).toHaveValue("Indeksowanie i testy.");
  for (const label of [
    "Co według materiału kandydat zrobił osobiście?",
    "Co wykonały inne osoby?",
    "Co wiadomo o rezultacie?",
  ]) {
    await page.getByRole("button", { name: `Nie mogę ustalić: ${label}`, exact: true }).click();
  }
  await page.getByRole("checkbox", { name: "Nie mogę ocenić", exact: true }).check();
  await page
    .getByLabel("Czego nadal nie wiadomo?", { exact: true })
    .fill("Rezultat i decyzja nie są opisane.");
  await select(page, "Kolejny krok", "Poproszę o doprecyzowanie");
  await page
    .getByLabel("Uzasadnienie kolejnego kroku", { exact: true })
    .fill("Potrzebuję informacji o rezultacie.");
  await page.getByRole("button", { name: "Zapisz wniosek", exact: true }).click();
  await expect(page.getByText("Wpisz pytanie do doprecyzowania.")).toBeVisible();
  await page
    .getByLabel("O co zapytasz przed zaproszeniem?", { exact: true })
    .fill("Co powstało i czy rozwiązanie było używane?");
  await page.getByRole("button", { name: "Zapisz wniosek", exact: true }).click();
  await expect(page.getByText("Wniosek zapisany", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Edytuj wniosek" })).toBeVisible();
  await person(page, "Marek Nowak");
  await page.goto(`/#/app/aplikacje/${appId}`);
  await expect(page.getByText("Potrzebuję informacji o rezultacie.")).toHaveCount(0);
  await expect(page.getByText("Aplikacja wysłana", { exact: true }).first()).toBeVisible();
});

test("failed browser persistence never confirms sharing and keeps the candidate draft", async ({
  page,
}) => {
  const state = sharedState();
  state.applications[0].contribution!.versions = [];
  state.applications[0].contribution!.sharedVersion = null;
  state.applications[0].contribution!.draft = {
    content: {
      ...emptyProject(),
      name: "Szkic przy awarii",
      problem: "Problem",
      own: "Mój zakres",
      teamMode: "solo",
      decisionMode: "none",
      resultMode: "unknown",
      availability: "unavailable",
    },
    revision: 1,
    updatedAt: time,
  };
  await seed(page, state);
  await page.goto(`/#/app/aplikacje/${appId}/projekt`);
  await page.getByRole("button", { name: "Dalej: materiał" }).click();
  await page.getByRole("button", { name: "Przejdź do podglądu" }).click();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Test quota failure", "QuotaExceededError");
    };
  });
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Zatwierdź i udostępnij kartę" }).click();
  await expect(page.getByRole("alert")).toContainText("Nie udało się udostępnić karty");
  await expect(page).toHaveURL(/\/projekt$/);
  await expect(page.getByRole("heading", { name: "Szkic przy awarii" })).toBeVisible();
});

test("E01 A/B retain the same supplied facts and share the answer-stage panel", async ({
  browser,
}) => {
  const facts: string[][] = [];
  for (const mode of ["A", "B"] as const) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await seed(
      page,
      transition(sharedState(), { type: "select_person", id: "employer-brightlabs" }),
    );
    await page.goto(`/#/app/kandydaci/${appId}/projekt?e01=1`);
    await expect(page.getByText("Indeksowanie i testy.", { exact: true })).toHaveCount(0);
    await page
      .getByRole("button", {
        name: mode === "A" ? "A — profil, odpowiedź i portfolio" : "B — karta projektu ze źródłami",
      })
      .click();
    await expect(page.getByRole("heading", { name: "Moje wnioski", exact: true })).toHaveCount(0);
    facts.push(await page.locator(".project-claim > p").allTextContents());
    await page.getByRole("button", { name: "Przejdź do zapisania odpowiedzi" }).click();
    await expect(
      page.getByLabel("Co według materiału kandydat zrobił osobiście?", { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByText(new RegExp(`E01 · format ${mode}`))).toBeVisible();
    await expect(page.getByRole("button", { name: /A — profil|B — karta/ })).toHaveCount(0);
    await context.close();
  }
  expect(facts[0]).toEqual(facts[1]);
});

test("candidate validates a material and reviews an editable AI proposal with original provenance", async ({
  page,
}) => {
  const state = sharedState();
  const content = { ...state.applications[0].contribution!.versions[0].content, materials: [] };
  state.applications[0].contribution = {
    versions: [],
    draft: { content, revision: 1, updatedAt: time },
  };
  await seed(page, state);
  await page.goto(`/#/app/aplikacje/${appId}/projekt`);
  await page.getByRole("button", { name: "Dalej: materiał" }).click();
  await page.getByRole("button", { name: "Dodaj materiał", exact: true }).click();
  await page.getByLabel("Nazwa materiału", { exact: true }).fill("Opis projektu po anonimizacji");
  await select(page, "Rodzaj materiału", "Link");
  await page.getByLabel("Link do materiału", { exact: true }).fill("javascript:alert(1)");
  await page
    .getByLabel("Gdzie dokładnie zajrzeć?", { exact: true })
    .fill("Sekcja o podziale pracy");
  await page
    .getByLabel("Co ten materiał pokazuje?", { exact: true })
    .fill("Deklarowany zakres indeksowania i testów.");
  await page.getByRole("button", { name: "Przejdź do podglądu" }).click();
  await expect(
    page.getByText("Wpisz pełny adres zaczynający się od https:// lub http://."),
  ).toBeVisible();
  await page.getByLabel("Link do materiału", { exact: true }).fill("https://example.com/project");
  await page.getByRole("button", { name: "Przejdź do podglądu" }).click();
  await page.getByRole("button", { name: "Uporządkuj opis z AI" }).click();
  await expect(page.getByRole("textbox", { name: "Własny wkład", exact: true })).toHaveValue(
    "Indeksowanie i testy.",
  );
  await page.getByRole("textbox", { name: "Własny wkład", exact: true }).fill("");
  await expect(
    page.getByRole("button", { name: "Użyj propozycji i przejdź ponownie do podglądu" }),
  ).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Własny wkład", exact: true })
    .fill("Indeksowanie oraz testy.");
  await page
    .getByRole("button", { name: "Użyj propozycji i przejdź ponownie do podglądu" })
    .click();
  await page.getByRole("button", { name: "Przejdź do podglądu" }).click();
  await expect(page.getByRole("button", { name: "Zatwierdź i udostępnij kartę" })).toBeDisabled();
  await page
    .getByRole("button", { name: "Pokaż podstawę opisu: Własny wkład", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Indeksowanie i testy.");
  await expect(page.getByRole("dialog")).toContainText("Indeksowanie oraz testy.");
  await page.getByRole("button", { name: "Zgłoś niedostępny materiał" }).click();
  await expect(page.getByRole("dialog")).toContainText("Nie udało się wyświetlić materiału");
  await page.getByRole("button", { name: "Zamknij", exact: true }).click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "artifacts/project-card/candidate-preview.png", fullPage: true });
});

test("project view is accessible and reflows at desktop, breakpoints and narrow mobile widths", async ({
  page,
}) => {
  await seed(page, transition(sharedState(), { type: "select_person", id: "employer-brightlabs" }));
  await page.goto(`/#/app/kandydaci/${appId}/projekt`);
  for (const width of [1280, 1100, 851, 850, 700, 600, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if ([1280, 390].includes(width))
      await page.screenshot({
        path: `artifacts/project-card/recruiter-${width}.png`,
        fullPage: true,
      });
    if (width === 1280) {
      await page.screenshot({
        path: "artifacts/project-card/recruiter-overview.png",
        fullPage: false,
      });
      expect(
        await page
          .locator(".project-page-header h1")
          .evaluate((el) => getComputedStyle(el).fontFamily),
      ).toContain("Geist Serif");
      expect(
        await page
          .locator(".project-page-header h1")
          .evaluate((el) => getComputedStyle(el).fontWeight),
      ).toBe("400");
      expect(
        await page
          .locator(".project-page-header h1")
          .evaluate((el) => getComputedStyle(el).fontSize),
      ).toBe("64px");
    }
  }
  await page
    .getByRole("button", { name: "Pokaż podstawę opisu: Własny wkład", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const dialogBox = await page.getByRole("dialog").boundingBox();
  expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(320);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: "artifacts/project-card/source-320.png", fullPage: false });
  await page.getByRole("button", { name: "Zamknij", exact: true }).click();
  expect((await new AxeBuilder({ page }).include(".project-page").analyze()).violations).toEqual(
    [],
  );
});

test("expanded role description stays beside the candidate wizard and preserves its draft", async ({
  page,
}) => {
  const state = transition(initialState(), { type: "select_person", id: "candidate-marek" });
  await seed(page, state);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/#/app/aplikacje/${appId}/projekt`);
  await page
    .getByLabel("Nazwa projektu", { exact: true })
    .fill("Zachowaj mój szkic podczas czytania");
  const disclosure = page.locator(".project-candidate-context summary");
  await disclosure.focus();
  await page.keyboard.press("Enter");
  const description = page.getByRole("region", { name: "Opis stanowiska", exact: true });
  await expect(description).toBeVisible();
  await expect(description.locator("h3").first()).toBeVisible();
  expect(await description.innerText()).not.toContain("###");
  const editor = page.locator(".project-candidate-work > .project-editor");
  const before = await editor.boundingBox();
  const editorTop = await editor.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  const context = await page.locator(".project-candidate-context").boundingBox();
  expect(context!.x + context!.width).toBeLessThan(before!.x);
  expect(before!.y).toBeLessThan(context!.y + 100);
  expect(await description.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await description.focus();
  await page.keyboard.press("End");
  await expect.poll(() => description.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await expect(page.getByLabel("Nazwa projektu", { exact: true })).toHaveValue(
    "Zachowaj mój szkic podczas czytania",
  );
  await disclosure.focus();
  await page.keyboard.press("Enter");
  const closedTop = await editor.evaluate((el) => el.getBoundingClientRect().top + window.scrollY);
  expect(Math.abs(closedTop - editorTop)).toBeLessThan(2);
  await page.keyboard.press("Enter");
  await description.focus();
  await page.keyboard.press("Home");
  await expect.poll(() => description.evaluate((el) => el.scrollTop)).toBe(0);
  await page.locator(".project-page-header").scrollIntoViewIfNeeded();
  await page.getByRole("heading", { name: "Pokaż swoją część pracy.", exact: true }).click();
  await page.screenshot({
    path: "artifacts/project-card-description-layout/desktop-1280.png",
    fullPage: false,
  });
  for (const width of [1480, 1100, 850, 760, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const left = await page.locator(".project-candidate-context").boundingBox();
    const right = await page.locator(".project-candidate-work").boundingBox();
    if (width === 1480) expect(left!.x + left!.width).toBeLessThan(right!.x);
    if (width <= 760) expect(right!.y).toBeGreaterThan(left!.y + left!.height);
    await expect(page.getByLabel("Nazwa projektu", { exact: true })).toHaveValue(
      "Zachowaj mój szkic podczas czytania",
    );
    if (width === 390)
      await page.screenshot({
        path: "artifacts/project-card-description-layout/mobile-390.png",
        fullPage: true,
      });
  }
  await page.reload();
  await expect(page.getByLabel("Nazwa projektu", { exact: true })).toHaveValue(
    "Zachowaj mój szkic podczas czytania",
  );
});

test("candidate can edit, cancel removal, remove and restore the attached project without withdrawing", async ({
  page,
}) => {
  await seed(page, sharedState());
  await page.goto(`/#/app/aplikacje/${appId}`);
  await expect(page.getByRole("link", { name: "Edytuj", exact: true })).toBeVisible();
  const remove = page.getByRole("button", { name: "Usuń kartę", exact: true });
  await remove.click();
  await expect(
    page.getByRole("button", { name: "Potwierdź usunięcie", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Anuluj", exact: true }).click();
  await expect(remove).toBeFocused();
  await page.locator(".project-invitation").screenshot({
    path: "artifacts/project-card-edit-delete/actions.png",
  });
  await remove.click();
  await page.getByRole("button", { name: "Potwierdź usunięcie", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Karta została usunięta z aplikacji", exact: true }),
  ).toBeFocused();
  await expect(page.getByText("Zobacz udostępnioną kartę", { exact: true })).toHaveCount(0);
  await expect(page.locator(".record-stage")).toHaveText("Aplikacja wysłana");
  await page.reload();
  await expect(page.getByRole("button", { name: "Cofnij usunięcie" })).toBeVisible();
  await person(page, "Karolina Wiśniewska");
  await page.goto("/#/app/kandydaci");
  await expect(
    page
      .locator("article")
      .filter({ has: page.getByRole("link", { name: "Marek Nowak", exact: true }) })
      .getByText("Karta projektu: Nie dołączono", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Wyszukiwarka procedur", { exact: true })).toHaveCount(0);
  await person(page, "Marek Nowak");
  await page.goto(`/#/app/aplikacje/${appId}`);
  await page.getByRole("button", { name: "Cofnij usunięcie" }).click();
  await expect(page.getByRole("link", { name: "Edytuj", exact: true })).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Wyszukiwarka procedur", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Edytuj", exact: true }).click();
  await expect(page.getByLabel("Nazwa projektu", { exact: true })).toHaveValue(
    "Wyszukiwarka procedur",
  );
  await page.goto(`/#/app/aplikacje/${appId}`);
  await remove.click();
  await page.getByRole("button", { name: "Potwierdź usunięcie", exact: true }).click();
  await page.getByRole("link", { name: "Dodaj projekt", exact: true }).click();
  await expect(page.getByLabel("Nazwa projektu", { exact: true })).toHaveValue("");
});

test("card removal keeps the published card and confirmation on storage failure", async ({
  page,
}) => {
  await seed(page, sharedState());
  await page.goto(`/#/app/aplikacje/${appId}`);
  await page.getByRole("button", { name: "Usuń kartę", exact: true }).click();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Test quota failure", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "Potwierdź usunięcie", exact: true }).click();
  await expect(
    page.getByText("Nie udało się usunąć karty. Spróbuj ponownie.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Wyszukiwarka procedur", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Cofnij usunięcie" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Potwierdź usunięcie", exact: true }),
  ).toBeVisible();
});
