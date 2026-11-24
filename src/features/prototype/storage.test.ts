import { describe, expect, it } from "vitest";
import { initialState, withPreparedExamples } from "./model";
import { sharedProjectVersion } from "./project-card-model";
import {
  MAX_IMPORT_BYTES,
  parseState,
  readState,
  saveState,
  serializeState,
  STORAGE_KEY,
} from "./storage";
function memory(raw: string | null = null) {
  const values = new Map(raw === null ? [] : [[STORAGE_KEY, raw]]);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
describe("browser persistence and recovery", () => {
  it("loads the prepared approved card and a separate application without a card", () => {
    const state = readState(memory()).state;
    const anna = state.applications.filter(
      (application) => application.candidateId === "candidate-anna",
    );
    expect(anna).toHaveLength(2);
    const card = anna.find((application) => application.jobTitle === "AI Product Manager")!;
    expect(card.id).toBe("b14dfee5-3b0b-4ecb-b8f3-a342d1926bfa");
    expect(sharedProjectVersion(card)?.version).toBe(2);
    expect(sharedProjectVersion(card)?.content.materials).toHaveLength(4);
    expect(sharedProjectVersion(card)?.content.limits).not.toContain("To przykład demonstracyjny");
    expect(card.projectReviews).toBeUndefined();
    expect(card.contribution?.draft).toBeUndefined();
    expect(
      anna.find((application) => application.jobTitle === "AI Operations Specialist")?.contribution,
    ).toBeUndefined();
  });
  it("upgrades an old browser once while preserving edits, persona and other records", () => {
    const legacy = initialState();
    delete legacy.preparedExamplesVersion;
    legacy.applications = legacy.applications.filter(
      (application) => application.candidateId !== "candidate-anna",
    );
    legacy.activePersonId = "employer-brightlabs";
    legacy.applications[0].answer = "Existing application and private content must survive.";
    const upgraded = readState(memory(serializeState(legacy))).state;
    expect(upgraded.applications).toHaveLength(3);
    expect(upgraded.applications[0]).toEqual(legacy.applications[0]);
    expect(upgraded.activePersonId).toBe(legacy.activePersonId);
    expect(upgraded.people).toEqual(legacy.people);
    const card = upgraded.applications.find(
      (application) => application.candidateId === "candidate-anna" && application.contribution,
    )!;
    card.contribution!.sharedVersion = null;
    expect(readState(memory(serializeState(upgraded))).state).toEqual(upgraded);
  });
  it("does not replace existing applications or unfinished candidate drafts on upgrade", () => {
    const legacy = initialState();
    delete legacy.preparedExamplesVersion;
    const existing = legacy.applications.find(
      (application) => application.candidateId === "candidate-anna" && application.contribution,
    )!;
    existing.id = "my-existing-anna-application";
    delete existing.contribution;
    legacy.applications = legacy.applications.filter(
      (application) => application.jobTitle !== "AI Operations Specialist",
    );
    legacy.drafts.push({
      candidateId: "candidate-anna",
      jobId: "20000000-0000-4000-8000-000000000004",
      notes: "My notes",
      generated: "",
      answer: "Unfinished application",
    });
    const upgraded = withPreparedExamples(legacy);
    expect(upgraded.applications).toEqual(legacy.applications);
    expect(upgraded.drafts).toEqual(legacy.drafts);
    expect(withPreparedExamples(upgraded)).toBe(upgraded);
  });
  it("skips prepared applications when their referenced job or candidate is unavailable", () => {
    const state = initialState();
    delete state.preparedExamplesVersion;
    state.applications = state.applications.filter(
      (application) => application.candidateId !== "candidate-anna",
    );
    state.jobs = state.jobs.filter((job) => job.slug !== "ai-operations-specialist");
    state.people = state.people.filter((person) => person.id !== "candidate-anna");
    expect(withPreparedExamples(state).applications).toEqual(state.applications);
  });
  it("round-trips a complete valid scenario", () => {
    const storage = memory();
    const s = initialState();
    saveState(storage, s);
    expect(readState(storage).state).toEqual(s);
    expect(parseState(serializeState(s))).toEqual(s);
  });
  it("protects incompatible/corrupt original saves", () => {
    for (const raw of ["{", JSON.stringify({ ...initialState(), version: 2 })]) {
      const storage = memory(raw);
      const loaded = readState(storage);
      expect(loaded.blocked).toBe(true);
      expect(loaded.original).toBe(raw);
      expect(storage.getItem(STORAGE_KEY)).toBe(raw);
    }
  });
  it("does not fail startup when storage access is denied", () => {
    expect(readState(null).state.jobs.length).toBeGreaterThan(0);
    expect(
      readState({
        getItem() {
          throw new Error("Denied");
        },
        setItem() {},
      }).blocked,
    ).toBe(true);
  });
  it("reports quota/write failure without altering the original", () => {
    const old = "old";
    const storage = {
      getItem: () => old,
      setItem() {
        throw new Error("QuotaExceededError");
      },
    };
    expect(() => saveState(storage, initialState())).toThrow("Wyeksportuj");
    expect(storage.getItem()).toBe(old);
  });
  it("rejects invalid references and oversized files", () => {
    const s = initialState();
    s.saved = [{ candidateId: "missing", jobId: s.jobs[0].id }];
    expect(() => parseState(JSON.stringify(s))).toThrow("Dotychczasowy stan");
    expect(() => parseState(" ".repeat(MAX_IMPORT_BYTES + 1))).toThrow("za duży");
  });
  it("accepts legacy appearance preferences without changing scenario data", () => {
    const state = initialState();
    for (const theme of ["dark", "system", "light"]) {
      expect(parseState(JSON.stringify({ ...state, theme }))).toEqual(state);
    }
  });
});
