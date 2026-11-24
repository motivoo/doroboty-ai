import { z } from "zod";

const text = z.string().max(12000);
export const sectionKeys = ["problem", "own", "team", "decision", "result", "limits"] as const;
export type SectionKey = (typeof sectionKeys)[number];
export const sectionLabels: Record<SectionKey, string> = {
  problem: "Problem",
  own: "Własny wkład",
  team: "Praca innych osób",
  decision: "Decyzja i uzasadnienie",
  result: "Rezultat i podstawa",
  limits: "Czego nie da się ustalić",
};
export const materialSchema = z.object({
  id: z.string().min(1).max(100),
  name: text,
  kind: z.enum(["link", "excerpt"]),
  value: text,
  location: text,
  target: z.enum(sectionKeys),
  shows: text,
  support: text,
});
export const projectContentSchema = z.object({
  name: z.string().max(200),
  problem: text,
  own: text,
  teamMode: z.enum(["", "description", "solo", "unknown"]),
  team: text,
  decisionMode: z.enum(["", "description", "none"]),
  decision: text,
  resultMode: z.enum(["", "description", "unknown"]),
  result: text,
  resultBasisMode: z.enum(["", "description", "none"]),
  resultBasis: text,
  limits: text,
  availability: z.enum(["", "yes", "redacted", "unavailable"]),
  unavailableReason: text,
  materials: z.array(materialSchema).max(10),
  presentation: z
    .object({ problem: text, own: text, team: text, decision: text, result: text, limits: text })
    .optional(),
});
export type ProjectContent = z.infer<typeof projectContentSchema>;
export type Material = z.infer<typeof materialSchema>;
export const emptyProject = (): ProjectContent => ({
  name: "",
  problem: "",
  own: "",
  teamMode: "",
  team: "",
  decisionMode: "",
  decision: "",
  resultMode: "",
  result: "",
  resultBasisMode: "",
  resultBasis: "",
  limits: "",
  availability: "",
  unavailableReason: "",
  materials: [],
});
export function projectErrors(content: ProjectContent, materials = true) {
  const errors: Record<string, string> = {};
  const need = (key: keyof ProjectContent, condition = true) => {
    if (condition && !String(content[key] ?? "").trim())
      errors[key] = "Uzupełnij to pole lub wybierz odpowiedź opisującą brak wiedzy.";
  };
  for (const key of ["name", "problem", "own", "teamMode", "decisionMode", "resultMode"] as const)
    need(key);
  need("team", content.teamMode === "description");
  need("decision", content.decisionMode === "description");
  need("result", content.resultMode === "description");
  need("resultBasisMode", content.resultMode === "description");
  need(
    "resultBasis",
    content.resultMode === "description" && content.resultBasisMode === "description",
  );
  if (materials) {
    need("availability");
    if (["yes", "redacted"].includes(content.availability)) {
      if (!content.materials.length)
        errors.materials = "Dodaj materiał albo wybierz, że nie możesz go udostępnić.";
      content.materials.forEach((m, index) => {
        for (const key of ["name", "value", "location", "shows"] as const)
          if (!m[key].trim()) errors[`material-${index}-${key}`] = "Uzupełnij to pole materiału.";
        if (m.kind === "link" && !safeMaterialURL(m.value))
          errors[`material-${index}-value`] =
            "Wpisz pełny adres zaczynający się od https:// lub http://.";
      });
    }
  }
  if (content.presentation && sectionKeys.some((key) => !content.presentation![key].trim()))
    errors.presentation = "Uzupełnij puste sekcje propozycji albo wróć do odpowiedzi źródłowych.";
  return errors;
}
export const readyProjectSchema = projectContentSchema.superRefine((value, ctx) => {
  for (const [path, message] of Object.entries(projectErrors(value)))
    ctx.addIssue({ code: "custom", path: [path], message });
  if (value.availability === "unavailable" && value.materials.length)
    ctx.addIssue({
      code: "custom",
      path: ["materials"],
      message: "Usuń materiały przed oznaczeniem ich braku.",
    });
  if (new Set(value.materials.map((m) => m.id)).size !== value.materials.length)
    ctx.addIssue({ code: "custom", message: "Duplicate material identifiers" });
});
export function safeMaterialURL(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}
export function rawSection(content: ProjectContent, key: SectionKey) {
  if (key === "team")
    return content.teamMode === "solo"
      ? "Projekt samodzielny"
      : content.teamMode === "unknown"
        ? "Nie wiem"
        : content.team;
  if (key === "decision")
    return content.decisionMode === "none"
      ? "Nie potrafię wskazać osobnej decyzji"
      : content.decision;
  if (key === "result")
    return content.resultMode === "unknown"
      ? "Nie znam rezultatu"
      : `${content.result}\n\nPodstawa: ${content.resultBasisMode === "none" ? "Nie mam danych" : content.resultBasis}`;
  if (key === "limits") return content.limits || "Nie podano";
  return content[key];
}
export function displayedSection(content: ProjectContent, key: SectionKey) {
  return content.presentation?.[key] ?? rawSection(content, key);
}
export const projectVersionSchema = z.object({
  version: z.number().int().positive(),
  at: z.iso.datetime(),
  approvedBy: z.string(),
  companyName: z.string(),
  roleDescription: text,
  content: readyProjectSchema,
});
export type ProjectVersion = z.infer<typeof projectVersionSchema>;
const projectDraftSchema = z.object({
  content: projectContentSchema,
  revision: z.number().int().nonnegative(),
  previewedRevision: z.number().int().nonnegative().optional(),
  updatedAt: z.iso.datetime(),
});
export const contributionSchema = z.object({
  draft: projectDraftSchema.optional(),
  versions: z.array(projectVersionSchema).max(30),
  sharedVersion: z.number().int().positive().nullable().optional(),
  removed: z
    .object({
      at: z.iso.datetime(),
      sharedVersion: z.number().int().positive().nullable(),
      draft: projectDraftSchema.optional(),
    })
    .optional(),
});
export function sharedProjectVersion(application: {
  contribution?: z.infer<typeof contributionSchema>;
}) {
  const project = application.contribution;
  if (!project || project.sharedVersion === null) return undefined;
  return project.sharedVersion === undefined
    ? project.versions.at(-1)
    : project.versions.find((version) => version.version === project.sharedVersion);
}
export const nextStepLabels = {
  conversation: "Zaproponuję rozmowę",
  clarification: "Poproszę o doprecyzowanie",
  technical: "Skonsultuję technicznie",
  later: "Wrócę później",
  end: "Zakończę rozpatrywanie",
};
const conclusionSchema = z.object({ text, bases: z.array(z.string().max(150)).max(30) });
export const reviewContentSchema = z.object({
  own: conclusionSchema,
  team: conclusionSchema,
  result: conclusionSchema,
  requirement: text,
  fragment: text,
  interpretation: text,
  unable: z.boolean(),
  unknowns: text,
  question: text,
  nextStep: z.enum(["", "conversation", "clarification", "technical", "later", "end"]),
  rationale: text,
});
export type ReviewContent = z.infer<typeof reviewContentSchema>;
export function emptyReview(): ReviewContent {
  return {
    own: { text: "", bases: [] },
    team: { text: "", bases: [] },
    result: { text: "", bases: [] },
    requirement: "",
    fragment: "",
    interpretation: "",
    unable: false,
    unknowns: "",
    question: "",
    nextStep: "",
    rationale: "",
  };
}
export function reviewErrors(value: ReviewContent) {
  const errors: Record<string, string> = {};
  for (const key of ["own", "team", "result"] as const) {
    if (!value[key].text.trim()) errors[key] = "Zapisz wniosek lub wybierz „Nie mogę ustalić”.";
    if (!value[key].bases.length)
      errors[`${key}-bases`] = "Wskaż podstawę albo zaznacz brak podstawy.";
  }
  if (
    !value.unable &&
    (!value.requirement.trim() || !value.fragment.trim() || !value.interpretation.trim())
  )
    errors.fit =
      "Wybierz zadanie roli, podstawę i wpisz własną interpretację albo zaznacz „Nie mogę ocenić”.";
  if (!value.unknowns.trim())
    errors.unknowns = "Wpisz niewiadome albo zaznacz brak dodatkowych pytań.";
  if (!value.nextStep) errors.nextStep = "Wybierz kolejny krok.";
  if (!value.rationale.trim())
    errors.rationale = "Uzasadnij wybrany krok, uwzględniając ograniczenia materiału.";
  if (value.nextStep === "clarification" && !value.question.trim())
    errors.question = "Wpisz pytanie do doprecyzowania.";
  return errors;
}
export const reviewSchema = z.object({
  id: z.string().min(1).max(100),
  authorId: z.string(),
  cardVersion: z.number().int().positive().nullable(),
  mode: z.enum(["standard", "A", "B"]),
  roleDescription: text,
  startedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  savedAt: z.iso.datetime().optional(),
  sourceOpens: z.number().int().nonnegative(),
  content: reviewContentSchema,
});
export type ProjectReview = z.infer<typeof reviewSchema>;
export const reviewStateSchema = z.object({
  draft: reviewSchema.optional(),
  saved: z.array(reviewSchema).max(100),
});
export type ProjectAction =
  | { type: "project_remove"; applicationId: string }
  | { type: "project_restore"; applicationId: string }
  | { type: "project_draft"; applicationId: string; content: ProjectContent }
  | { type: "project_preview"; applicationId: string }
  | { type: "project_share"; applicationId: string; approved: boolean }
  | { type: "review_start"; applicationId: string; mode: "standard" | "A" | "B"; editId?: string }
  | { type: "review_draft"; applicationId: string; content: ReviewContent }
  | { type: "review_source"; applicationId: string }
  | { type: "review_save"; applicationId: string };
