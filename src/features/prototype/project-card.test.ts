import { describe, expect, it } from "vitest";
import { initialState, transition, stateSchema, type State } from "./model";
import {
  emptyProject,
  emptyReview,
  readyProjectSchema,
  sharedProjectVersion,
  type ProjectContent,
} from "./project-card-model";
import { parseState, serializeState } from "./storage";

const at = "2026-11-20T14:00:00.000Z";
const appId = "application-example";
export function projectFixture(): ProjectContent {
  return {
    ...emptyProject(),
    name: "Wyszukiwarka dokumentów",
    problem: "Odnajdywanie procedur w dokumentach.",
    own: "Indeksowanie i testy.",
    teamMode: "description",
    team: "API przygotowała inna osoba.",
    decisionMode: "none",
    resultMode: "unknown",
    availability: "yes",
    materials: [
      {
        id: "source-one",
        name: "Podział pracy",
        kind: "excerpt",
        value: "Kandydat: indeksowanie i testy. Inna osoba: API.",
        location: "Opis projektu, akapit 1",
        target: "own",
        shows: "Deklarowany podział pracy",
        support: "Nie podano",
      },
    ],
  };
}
function candidate() {
  return transition(initialState(), { type: "select_person", id: "candidate-marek" });
}
function draft(state = candidate()) {
  return transition(
    state,
    { type: "project_draft", applicationId: appId, content: projectFixture() },
    at,
  );
}
function share(state = draft()) {
  return transition(
    transition(state, { type: "project_preview", applicationId: appId }, at),
    { type: "project_share", applicationId: appId, approved: true },
    at,
  );
}
function employer(state: State) {
  return transition(state, { type: "select_person", id: "employer-brightlabs" });
}
function completedReview() {
  const content = emptyReview();
  for (const key of ["own", "team", "result"] as const)
    content[key] = { text: "Nie mogę ustalić", bases: ["no_basis"] };
  return {
    ...content,
    unable: true,
    unknowns: "Brak rezultatu w materiale.",
    nextStep: "technical" as const,
    rationale: "Potrzebuję konsultacji technicznej.",
  };
}
describe("application contribution cards", () => {
  it("removes only the owner's card and restores its published version and private draft", () => {
    let state = share();
    state = transition(
      state,
      {
        type: "project_draft",
        applicationId: appId,
        content: { ...projectFixture(), name: "Private edit" },
      },
      at,
    );
    const original = structuredClone(state.applications[0]);
    const removed = transition(state, { type: "project_remove", applicationId: appId }, at);
    expect(sharedProjectVersion(removed.applications[0])).toBeUndefined();
    expect(removed.applications[0].contribution?.draft).toBeUndefined();
    expect(removed.applications[0].stage).toBe(original.stage);
    expect(removed.applications[0].score).toBe(original.score);
    expect(removed.applications[0].events).toEqual(original.events);
    expect(parseState(serializeState(removed))).toEqual(removed);
    const restored = transition(removed, { type: "project_restore", applicationId: appId }, at);
    expect(sharedProjectVersion(restored.applications[0])).toEqual(sharedProjectVersion(original));
    expect(restored.applications[0].contribution?.draft).toEqual(original.contribution?.draft);
    expect(restored.applications[0].contribution?.removed).toBeUndefined();
    expect(() =>
      transition(
        transition(state, { type: "select_person", id: "candidate-anna" }),
        { type: "project_remove", applicationId: appId },
        at,
      ),
    ).toThrow("innego kandydata");
    expect(() =>
      transition(employer(removed), { type: "project_restore", applicationId: appId }, at),
    ).toThrow();
  });
  it("keeps historical review sources while new reviews see no removed card, and permits re-adding", () => {
    let state = transition(
      employer(share()),
      { type: "review_start", applicationId: appId, mode: "B" },
      at,
      "frozen-review",
    );
    const frozen = structuredClone(state.applications[0].projectReviews);
    state = transition(state, { type: "select_person", id: "candidate-marek" });
    state = transition(state, { type: "project_remove", applicationId: appId }, at);
    expect(state.applications[0].projectReviews).toEqual(frozen);
    expect(state.applications[0].contribution?.versions[0].version).toBe(1);
    const withoutReview = structuredClone(state);
    delete withoutReview.applications[0].projectReviews;
    const newReview = transition(
      employer(withoutReview),
      { type: "review_start", applicationId: appId, mode: "standard" },
      at,
      "new-review",
    );
    expect(newReview.applications[0].projectReviews?.draft?.cardVersion).toBeNull();
    expect(() =>
      transition(
        employer(withoutReview),
        { type: "review_start", applicationId: appId, mode: "A" },
        at,
      ),
    ).toThrow("wspólnego materiału");
    state = draft(state);
    expect(state.applications[0].contribution?.removed).toBeUndefined();
    expect(sharedProjectVersion(state.applications[0])).toBeUndefined();
    state = share(state);
    expect(sharedProjectVersion(state.applications[0])?.version).toBe(2);
    expect(state.applications[0].projectReviews).toEqual(frozen);
  });
  it("validates removed-card references and reads legacy published cards without a version pointer", () => {
    const state = share();
    delete state.applications[0].contribution!.sharedVersion;
    expect(sharedProjectVersion(parseState(serializeState(state)).applications[0])?.version).toBe(
      1,
    );
    state.applications[0].contribution!.sharedVersion = 99;
    expect(stateSchema.safeParse(state).success).toBe(false);
    state.applications[0].contribution!.sharedVersion = null;
    state.applications[0].contribution!.removed = { at, sharedVersion: 99 };
    expect(stateSchema.safeParse(state).success).toBe(false);
  });
  it("keeps old version-1 saves readable and new drafts private from published versions", () => {
    const old = initialState();
    expect(parseState(serializeState(old))).toEqual(old);
    const s = draft();
    expect(s.applications[0].contribution?.versions).toEqual([]);
    expect(s.applications[0].stage).toBe("submitted");
    expect(s.applications[0].score).toBe(old.applications[0].score);
  });
  it("requires a current preview and explicit candidate approval", () => {
    const s = draft();
    expect(() =>
      transition(s, { type: "project_share", applicationId: appId, approved: true }, at),
    ).toThrow("podgląd");
    const previewed = transition(s, { type: "project_preview", applicationId: appId }, at);
    expect(() =>
      transition(previewed, { type: "project_share", applicationId: appId, approved: false }, at),
    ).toThrow();
    const edited = transition(
      previewed,
      {
        type: "project_draft",
        applicationId: appId,
        content: { ...projectFixture(), own: "Zmieniony zakres" },
      },
      at,
    );
    expect(() =>
      transition(edited, { type: "project_share", applicationId: appId, approved: true }, at),
    ).toThrow();
  });
  it("accepts explicit unknowns, solo projects and unavailable confidential material", () => {
    const content = {
      ...projectFixture(),
      teamMode: "solo" as const,
      availability: "unavailable" as const,
      materials: [],
      unavailableReason: "Poufność",
    };
    expect(readyProjectSchema.safeParse(content).success).toBe(true);
    expect(readyProjectSchema.safeParse({ ...content, own: " " }).success).toBe(false);
    expect(
      readyProjectSchema.safeParse({
        ...content,
        presentation: {
          problem: "Problem",
          own: "",
          team: "Projekt samodzielny",
          decision: "Nie potrafię wskazać osobnej decyzji",
          result: "Nie znam rezultatu",
          limits: "Nie podano",
        },
      }).success,
    ).toBe(false);
    expect(
      readyProjectSchema.safeParse({
        ...projectFixture(),
        materials: [
          { ...projectFixture().materials[0], kind: "link", value: "javascript:alert(1)" },
        ],
      }).success,
    ).toBe(false);
  });
  it("preserves published versions and pins review material when a newer card is shared", () => {
    let s = share();
    s = employer(s);
    s = transition(s, { type: "review_start", applicationId: appId, mode: "B" }, at, "review-one");
    s = transition(s, { type: "select_person", id: "candidate-marek" });
    s = transition(
      s,
      {
        type: "project_draft",
        applicationId: appId,
        content: { ...projectFixture(), own: "Nowy opis wkładu" },
      },
      at,
    );
    const before = s.applications[0].contribution!.versions[0];
    s = share(s);
    expect(s.applications[0].contribution!.versions[0]).toEqual(before);
    expect(s.applications[0].contribution!.versions).toHaveLength(2);
    expect(s.applications[0].projectReviews!.draft!.cardVersion).toBe(1);
    expect(parseState(serializeState(s))).toEqual(s);
  });
  it("rejects wrong-person and wrong-company project/review mutations", () => {
    let s = transition(share(), { type: "select_person", id: "candidate-anna" });
    expect(() => draft(s)).toThrow("innego kandydata");
    s = transition(s, { type: "select_person", id: "employer-northstar" });
    expect(() =>
      transition(s, { type: "review_start", applicationId: appId, mode: "standard" }, at),
    ).toThrow("własnej firmy");
  });
  it("requires justified evidence and a clarification question, without changing the recruiting stage", () => {
    let s = transition(
      employer(share()),
      { type: "review_start", applicationId: appId, mode: "standard" },
      at,
      "review-one",
    );
    expect(() => transition(s, { type: "review_save", applicationId: appId }, at)).toThrow();
    s = transition(
      s,
      {
        type: "review_draft",
        applicationId: appId,
        content: { ...completedReview(), nextStep: "clarification" },
      },
      at,
    );
    expect(() => transition(s, { type: "review_save", applicationId: appId }, at)).toThrow(
      "pytanie",
    );
    s = transition(
      s,
      { type: "review_draft", applicationId: appId, content: completedReview() },
      at,
    );
    s = transition(s, { type: "review_save", applicationId: appId }, at);
    expect(s.applications[0].projectReviews!.saved[0].cardVersion).toBe(1);
    expect(s.applications[0].stage).toBe("submitted");
    expect(s.applications[0].events).toHaveLength(1);
  });
  it("rejects broken version/author references and incomplete completed notes on import", () => {
    const s = transition(
      employer(share()),
      { type: "review_start", applicationId: appId, mode: "standard" },
      at,
      "review-one",
    );
    const review = s.applications[0].projectReviews!.draft!;
    review.cardVersion = 99;
    expect(stateSchema.safeParse(s).success).toBe(false);
    review.cardVersion = 1;
    review.authorId = "candidate-anna";
    expect(stateSchema.safeParse(s).success).toBe(false);
  });
  it("freezes E01 material, preserves edit history and prevents a second format", () => {
    let s = transition(
      employer(share()),
      { type: "review_start", applicationId: appId, mode: "A" },
      at,
      "review-one",
    );
    expect(() =>
      transition(s, { type: "review_start", applicationId: appId, mode: "B" }, at),
    ).toThrow("zamrożone");
    s = transition(
      s,
      { type: "review_draft", applicationId: appId, content: completedReview() },
      at,
    );
    s = transition(s, { type: "review_save", applicationId: appId }, at);
    expect(() =>
      transition(s, { type: "review_start", applicationId: appId, mode: "B" }, at),
    ).toThrow("jednym formacie");
    s = transition(
      s,
      { type: "review_start", applicationId: appId, mode: "standard", editId: "review-one" },
      at,
      "review-two",
    );
    expect(s.applications[0].projectReviews!.saved).toHaveLength(1);
    expect(s.applications[0].projectReviews!.draft!.mode).toBe("A");
  });
});
