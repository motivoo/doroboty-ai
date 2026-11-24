import type { Application, Person } from "./model";
import {
  emptyReview,
  readyProjectSchema,
  projectContentSchema,
  reviewContentSchema,
  reviewErrors,
  sharedProjectVersion,
  type ProjectAction,
} from "./project-card-model";

export function updateProject(
  application: Application,
  person: Person,
  action: ProjectAction,
  context: { now: string; newId: string; companyName: string; roleDescription: string },
) {
  const fail = (message: string): never => {
    throw new Error(message);
  };
  if (action.type.startsWith("project_")) {
    if (person.role !== "candidate" || application.candidateId !== person.id)
      fail("Ta karta należy do innego kandydata.");
    const project = (application.contribution ??= { versions: [] });
    if (action.type === "project_remove") {
      if (!sharedProjectVersion(application) && !project.draft)
        return fail("Nie ma karty ani szkicu do usunięcia.");
      project.removed = {
        at: context.now,
        sharedVersion: sharedProjectVersion(application)?.version ?? null,
        draft: project.draft,
      };
      project.sharedVersion = null;
      delete project.draft;
    } else if (action.type === "project_restore") {
      if (!project.removed) return fail("Nie ma usuniętej karty do przywrócenia.");
      project.sharedVersion = project.removed.sharedVersion;
      project.draft = project.removed.draft;
      delete project.removed;
    } else if (action.type === "project_draft") {
      const content = projectContentSchema.parse(action.content);
      delete project.removed;
      if (JSON.stringify(content) !== JSON.stringify(project.draft?.content))
        project.draft = {
          content,
          revision: (project.draft?.revision ?? 0) + 1,
          updatedAt: context.now,
        };
    } else if (action.type === "project_preview") {
      if (!project.draft) return fail("Najpierw zapisz opis projektu.");
      readyProjectSchema.parse(project.draft.content);
      project.draft.previewedRevision = project.draft.revision;
    } else if (action.type === "project_share") {
      const draft = project.draft;
      if (!draft || draft.previewedRevision !== draft.revision || !action.approved)
        return fail("Przejrzyj aktualny podgląd i zatwierdź treść karty.");
      project.versions.push({
        version: project.versions.length + 1,
        at: context.now,
        approvedBy: person.id,
        companyName: context.companyName,
        roleDescription: context.roleDescription,
        content: readyProjectSchema.parse(draft.content),
      });
      project.sharedVersion = project.versions.length;
      delete project.removed;
      delete project.draft;
    }
    return;
  }
  if (person.role !== "employer" || application.companyId !== person.companyId)
    fail("Wybierz zgłoszenie własnej firmy.");
  const reviews = (application.projectReviews ??= { saved: [] });
  if (action.type === "review_start") {
    if (reviews.draft)
      return fail(
        "Najpierw zakończ rozpoczęty przegląd. Jego materiał i wersja pozostają zamrożone.",
      );
    const previous = action.editId ? reviews.saved.find((r) => r.id === action.editId) : undefined;
    if (action.editId && !previous) return fail("Nie znaleziono wniosku.");
    if (
      action.mode !== "standard" &&
      !previous &&
      reviews.saved.some((r) => r.authorId === person.id)
    )
      return fail("W E01 jedna osoba ocenia to zgłoszenie tylko w jednym formacie.");
    const version = previous
      ? application.contribution?.versions.find((v) => v.version === previous.cardVersion)
      : sharedProjectVersion(application);
    if (action.mode !== "standard" && !version)
      return fail("E01 wymaga zatwierdzonego wspólnego materiału źródłowego.");
    reviews.draft = {
      id: context.newId,
      authorId: person.id,
      mode: previous?.mode ?? action.mode,
      cardVersion: previous ? previous.cardVersion : (version?.version ?? null),
      roleDescription:
        previous?.roleDescription ?? version?.roleDescription ?? context.roleDescription,
      startedAt: context.now,
      updatedAt: context.now,
      sourceOpens: 0,
      content: previous ? structuredClone(previous.content) : emptyReview(),
    };
  } else {
    const draft = reviews.draft;
    if (!draft || draft.authorId !== person.id)
      return fail("Rozpocznij własny przegląd zgłoszenia.");
    if (action.type === "review_draft") draft.content = reviewContentSchema.parse(action.content);
    if (action.type === "review_source") draft.sourceOpens += 1;
    if (action.type === "review_save") {
      const firstError = Object.values(reviewErrors(draft.content))[0];
      if (firstError) return fail(firstError);
      const validBases = new Set([
        "answer",
        "cv",
        "no_basis",
        "problem",
        "own",
        "team",
        "decision",
        "result",
        "limits",
      ]);
      const version = application.contribution?.versions.find(
        (v) => v.version === draft.cardVersion,
      );
      for (const material of version?.content.materials ?? [])
        validBases.add(`material:${material.id}`);
      for (const key of ["own", "team", "result"] as const) {
        const bases = draft.content[key].bases;
        if (
          bases.some((b) => !validBases.has(b)) ||
          (bases.includes("no_basis") && bases.length > 1)
        )
          fail("Sprawdź wskazane podstawy wniosku.");
      }
      if (!draft.content.unable && !validBases.has(draft.content.fragment))
        fail("Wybierz dostępną podstawę odniesienia do roli.");
      if (!draft.content.unable && !draft.roleDescription.includes(draft.content.requirement))
        fail("Wybierz wymaganie z zachowanego opisu roli.");
      draft.savedAt = context.now;
      draft.updatedAt = context.now;
      reviews.saved.push(structuredClone(draft));
      delete reviews.draft;
      return;
    }
    draft.updatedAt = context.now;
  }
}
