import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { BackLink } from "@/components/back-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { parseJobDescription } from "@/features/jobs/description";
import { currentPerson, type Application } from "./model";
import { usePrototype } from "./store";
import { NotFound } from "./shell";
import { ProjectReading } from "./project-card-reading";
import { ProjectField, ProjectSelect } from "./project-card-fields";
import {
  nextStepLabels,
  reviewErrors,
  sectionKeys,
  sectionLabels,
  sharedProjectVersion,
  type ProjectReview,
  type ProjectVersion,
  type ReviewContent,
} from "./project-card-model";

export function reviewStatus(application: Application) {
  return application.projectReviews?.draft
    ? "Przegląd rozpoczęty"
    : application.projectReviews?.saved.length
      ? "Wniosek zapisany"
      : "Do przejrzenia";
}
export function ProjectRecruiterPage() {
  const { id } = useParams();
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  const application = state.applications.find(
    (a) => a.id === id && a.companyId === person.companyId,
  );
  if (!application) return <NotFound />;
  return <RecruiterProject key={application.id} application={application} />;
}

function RecruiterProject({ application }: { application: Application }) {
  const { state, run } = usePrototype();
  const person = currentPerson(state)!;
  const [params] = useSearchParams();
  const e01 = params.has("e01");
  const draft = application.projectReviews?.draft;
  const saved = application.projectReviews?.saved.at(-1);
  const review = draft ?? saved;
  const latest = sharedProjectVersion(application);
  const version = review
    ? application.contribution?.versions.find((v) => v.version === review.cardVersion)
    : latest;
  const company = state.companies.find((c) => c.id === application.companyId);
  const job = state.jobs.find((j) => j.id === application.jobId);
  const roleDescription =
    review?.roleDescription ??
    latest?.roleDescription ??
    job?.description ??
    "Opis roli niedostępny.";
  const [notesVisible, setNotesVisible] = useState(!e01 || Boolean(saved));
  const [startError, setStartError] = useState("");
  const next = state.applications.filter(
    (a) => a.companyId === application.companyId && a.id !== application.id,
  )[0];
  useEffect(() => {
    if (!e01 && !draft && !saved)
      run({ type: "review_start", applicationId: application.id, mode: "standard" });
  }, [application.id, draft, e01, run, saved]);
  const otherAuthor = draft && draft.authorId !== person.id;
  const needsAssignment = e01 && !review;
  return (
    <article className="project-page">
      <BackLink to="/app/kandydaci">Kandydaci</BackLink>
      <header className="project-page-header">
        <span className="project-eyebrow">
          {review?.mode && review.mode !== "standard"
            ? `E01 · format ${review.mode} · materiał zamrożony`
            : "Przegląd zgłoszenia"}
        </span>
        <h1>{application.candidateName}</h1>
        <p>
          {application.jobTitle} · {company?.name}
          {version && ` · karta, wersja ${version.version}`}
        </p>
      </header>
      {needsAssignment ? (
        <section className="record-sheet project-editor">
          <h2>Przygotuj sesję E01</h2>
          <p>
            Wybierz format przydzielony tej osobie przed lekturą zgłoszenia. Jeden rekruter ogląda
            ten przypadek tylko raz. Oba formaty zawierają identyczną zatwierdzoną treść, CV,
            odpowiedź i opis roli.
          </p>
          <p className="record-caption">
            Przed badaniem przygotuj klucz oceny i przydział uczestników poza aplikacją. Ten widok
            nie mierzy autorstwa ani samodzielnego przygotowania karty przez kandydata.
          </p>
          {latest ? (
            <div className="record-actions">
              {(["A", "B"] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={mode === "A" ? "outline" : "default"}
                  onClick={() => {
                    if (!run({ type: "review_start", applicationId: application.id, mode }))
                      setStartError(
                        "Nie można rozpocząć kolejnego formatu dla tej osoby i zgłoszenia.",
                      );
                  }}
                >
                  {mode === "A"
                    ? "A — profil, odpowiedź i portfolio"
                    : "B — karta projektu ze źródłami"}
                </Button>
              ))}
            </div>
          ) : (
            <p>
              Nie dołączono karty. E01 wymaga wspólnego, zatwierdzonego materiału do obu formatów.
            </p>
          )}
          {startError && <p role="alert">{startError}</p>}
        </section>
      ) : (
        <>
          <section className="project-context project-role" aria-label="Zadania i wymagania roli">
            <h2>Zadania i wymagania roli</h2>
            <details>
              <summary>Przeczytaj opis roli</summary>
              <p>{roleDescription}</p>
            </details>
          </section>
          {review?.mode !== "standard" && review && (
            <section className="project-task">
              <strong>Zadanie dla osoby czytającej</strong>
              <p>
                Przeczytaj wymagania roli i zgłoszenie. Powiedz, co kandydat zrobił osobiście, co
                zrobiły inne osoby i co wiesz o rezultacie. Wskaż fragmenty, na których się
                opierasz. Co pasuje do tej pracy, czego nie można ustalić i o co zapytasz przed
                zaproszeniem?
              </p>
              <p className="record-caption">
                Materiał i wymagania są zamrożone na czas tej sesji. Dodatkowe wyjaśnienia AI są
                wyłączone w obu formatach. Pomoc badacza i kodowanie odpowiedzi zapisuj w arkuszu
                obserwacji.
              </p>
            </section>
          )}
          {latest && review && latest.version !== review.cardVersion && (
            <p className="project-notice">
              Dostępna jest karta w wersji {latest.version}. Ten przegląd pozostaje przypisany do{" "}
              {review.cardVersion === null ? "aplikacji bez karty" : `wersji ${review.cardVersion}`}
              . Zapisane wnioski zachowają tę podstawę.
            </p>
          )}
          {!latest && version && (
            <p className="project-notice">
              Karta została usunięta z aplikacji. Ten przegląd zachowuje wcześniej udostępnioną
              wersję {version.version} jako podstawę zapisanych wniosków.
            </p>
          )}
          <div className={`project-review-layout ${notesVisible ? "" : "project-review-reading"}`}>
            <div className="project-review-materials">
              {review?.mode === "A" && (
                <section className="record-sheet project-editor">
                  <h2>Profil i przesłana odpowiedź</h2>
                  <h3>{application.candidateName}</h3>
                  <p>{application.answer}</p>
                  <h3>CV z momentu aplikowania</h3>
                  <p>{application.cv}</p>
                </section>
              )}
              {version ? (
                <section className="record-sheet">
                  <ProjectReading
                    content={version.content}
                    flat={review?.mode === "A"}
                    onSourceOpen={() => {
                      if (draft && !otherAuthor)
                        run({ type: "review_source", applicationId: application.id });
                    }}
                  />
                </section>
              ) : (
                <section className="record-sheet project-editor">
                  <h2>Nie dołączono karty projektu</h2>
                  <p>
                    Możesz przeczytać zwykłe materiały aplikacji i zapisać, czego nie da się
                    ustalić.
                  </p>
                  <p>{application.answer}</p>
                  <h3>CV z momentu aplikowania</h3>
                  <p>{application.cv}</p>
                </section>
              )}
              {version && review?.mode !== "A" && (
                <details className="record-sheet project-originals">
                  <summary>Zwykłe materiały: profil, odpowiedź i portfolio</summary>
                  <h3>{application.candidateName}</h3>
                  <p>{application.answer}</p>
                  <h3>CV z momentu aplikowania</h3>
                  <p>{application.cv}</p>
                </details>
              )}
              {!e01 && (
                <Link
                  to={`/app/kandydaci/${application.id}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Wróć do profilu i historii aplikacji
                </Link>
              )}
            </div>
            {notesVisible && (
              <aside className="record-sheet project-review-notes" aria-label="Moje wnioski">
                <h2>Moje wnioski</h2>
                <p className="record-caption">
                  Wewnętrzna notatka. Zapis kroku nie wysyła wiadomości ani nie zmienia statusu
                  aplikacji.
                </p>
                {otherAuthor ? (
                  <p>
                    Przegląd rozpoczęła inna osoba w zespole. Jej szkic pozostaje przypisany do
                    autora.
                  </p>
                ) : draft ? (
                  <ReviewEditor application={application} review={draft} version={version} />
                ) : saved ? (
                  <>
                    <SavedReview review={saved} application={application} />
                    <div className="record-actions">
                      <Button
                        variant="outline"
                        onClick={() =>
                          run({
                            type: "review_start",
                            applicationId: application.id,
                            mode: "standard",
                            editId: saved.id,
                          })
                        }
                      >
                        Edytuj wniosek
                      </Button>
                      {(latest?.version ?? null) !== saved.cardVersion &&
                        saved.mode === "standard" && (
                          <Button
                            onClick={() =>
                              run({
                                type: "review_start",
                                applicationId: application.id,
                                mode: "standard",
                              })
                            }
                          >
                            {latest
                              ? "Rozpocznij przegląd aktualnej wersji"
                              : "Rozpocznij przegląd bez karty"}
                          </Button>
                        )}
                      {next && (
                        <Link to={`/app/kandydaci/${next.id}/projekt`} className={buttonVariants()}>
                          Przejdź do następnego zgłoszenia
                        </Link>
                      )}
                    </div>
                    {(application.projectReviews?.saved.length ?? 0) > 1 && (
                      <details className="project-review-history">
                        <summary>
                          Wcześniejsze wnioski ({application.projectReviews!.saved.length - 1})
                        </summary>
                        {application.projectReviews!.saved.slice(0, -1).map((r) => (
                          <SavedReview key={r.id} review={r} application={application} />
                        ))}
                      </details>
                    )}
                  </>
                ) : (
                  <Button
                    onClick={() =>
                      run({ type: "review_start", applicationId: application.id, mode: "standard" })
                    }
                  >
                    Rozpocznij przegląd
                  </Button>
                )}
              </aside>
            )}
          </div>
          {!notesVisible && (
            <div className="record-actions">
              <Button onClick={() => setNotesVisible(true)}>Przejdź do zapisania odpowiedzi</Button>
            </div>
          )}
        </>
      )}
    </article>
  );
}

function evidenceOptions(version?: ProjectVersion) {
  return [
    { value: "answer", label: "Przesłana odpowiedź" },
    { value: "cv", label: "CV z momentu aplikowania" },
    ...(version
      ? sectionKeys.map((value) => ({ value, label: `Opis kandydata: ${sectionLabels[value]}` }))
      : []),
    ...(version?.content.materials.map((m) => ({
      value: `material:${m.id}`,
      label: `Materiał: ${m.name}`,
    })) ?? []),
    { value: "no_basis", label: "Brak podstawy w dostępnym materiale" },
  ];
}
function roleTasks(description: string) {
  let relevant = false;
  const tasks: string[] = [];
  for (const block of parseJobDescription(description)) {
    if (block.type === "heading")
      relevant = /odpowiedzial|oczek|zadani|wymaga|pierwsz|o roli/i.test(block.text);
    else if (relevant) tasks.push(...(block.type === "list" ? block.items : [block.text]));
  }
  return [...new Set(tasks.length ? tasks : [description])];
}
function ReviewEditor({
  application,
  review,
  version,
}: {
  application: Application;
  review: ProjectReview;
  version?: ProjectVersion;
}) {
  const { run, issue } = usePrototype();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const content = review.content;
  const bases = evidenceOptions(version);
  function update(value: Partial<ReviewContent>) {
    setErrors({});
    run({ type: "review_draft", applicationId: application.id, content: { ...content, ...value } });
  }
  return (
    <form
      className="project-form-fields"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const found = reviewErrors(content);
        setErrors(found);
        if (Object.keys(found).length) {
          requestAnimationFrame(() =>
            document
              .querySelector<HTMLElement>(
                ".project-review-notes [aria-invalid='true'], .project-review-notes [role='alert']",
              )
              ?.focus(),
          );
          return;
        }
        if (run({ type: "review_save", applicationId: application.id }))
          requestAnimationFrame(() =>
            document.getElementById(`saved-review-${review.id}`)?.focus(),
          );
      }}
    >
      <p className="record-caption" role="status">
        {issue
          ? "Szkic pozostaje w tej sesji. Sprawdź komunikat o zapisie."
          : "Szkic zapisuje się automatycznie."}{" "}
        Podstawa:{" "}
        {review.cardVersion === null
          ? "aplikacja bez karty"
          : `karta, wersja ${review.cardVersion}`}
        .
      </p>
      {(
        [
          ["own", "Co według materiału kandydat zrobił osobiście?"],
          ["team", "Co wykonały inne osoby?"],
          ["result", "Co wiadomo o rezultacie?"],
        ] as const
      ).map(([key, label]) => (
        <fieldset key={key} className="project-conclusion">
          <ProjectField
            id={`review-${key}`}
            label={label}
            value={content[key].text}
            error={errors[key]}
            onChange={(text) => update({ [key]: { ...content[key], text } })}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`Nie mogę ustalić: ${label}`}
            onClick={() => update({ [key]: { text: "Nie mogę ustalić", bases: ["no_basis"] } })}
          >
            Nie mogę ustalić<span className="sr-only">: {label}</span>
          </Button>
          {key === "team" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                update({
                  team: { ...content.team, text: "W materiale opisano projekt samodzielny" },
                })
              }
            >
              W materiale opisano projekt samodzielny
            </Button>
          )}
          <details className="project-evidence" open={Boolean(errors[`${key}-bases`]) || undefined}>
            <summary>Na czym opierasz ten wniosek? ({content[key].bases.length})</summary>
            {bases.map((base) => (
              <label className="application-consent" key={base.value}>
                <Checkbox
                  checked={content[key].bases.includes(base.value)}
                  onCheckedChange={(checked) => {
                    const selected =
                      base.value === "no_basis"
                        ? checked
                          ? ["no_basis"]
                          : []
                        : checked
                          ? [...content[key].bases.filter((b) => b !== "no_basis"), base.value]
                          : content[key].bases.filter((b) => b !== base.value);
                    update({ [key]: { ...content[key], bases: selected } });
                  }}
                />
                <span>{base.label}</span>
              </label>
            ))}
          </details>
          {errors[`${key}-bases`] && (
            <p role="alert" tabIndex={-1} className="error-message">
              {errors[`${key}-bases`]}
            </p>
          )}
        </fieldset>
      ))}
      <fieldset className="project-conclusion">
        <legend>Co odpowiada zadaniom tej roli?</legend>
        <label className="application-consent">
          <Checkbox checked={content.unable} onCheckedChange={(unable) => update({ unable })} />
          <span>Nie mogę ocenić</span>
        </label>
        {!content.unable && (
          <>
            <ProjectSelect
              id="review-requirement"
              label="Wybierz zadanie lub wymaganie z opisu roli"
              value={content.requirement}
              onChange={(requirement) => update({ requirement })}
              options={roleTasks(review.roleDescription).map((value) => ({
                value,
                label: value.length > 140 ? `${value.slice(0, 140)}…` : value,
              }))}
            />
            {content.requirement && <p className="record-caption">{content.requirement}</p>}
            <ProjectSelect
              id="review-fragment"
              label="Wskaż element materiału"
              value={content.fragment}
              onChange={(fragment) => update({ fragment })}
              options={bases}
            />
            <ProjectField
              id="review-interpretation"
              label="Twoja interpretacja związku z rolą"
              value={content.interpretation}
              onChange={(interpretation) => update({ interpretation })}
            />
          </>
        )}
        {errors.fit && (
          <p role="alert" tabIndex={-1} className="error-message">
            {errors.fit}
          </p>
        )}
      </fieldset>
      <ProjectField
        id="review-unknowns"
        label="Czego nadal nie wiadomo?"
        value={content.unknowns}
        error={errors.unknowns}
        onChange={(unknowns) => update({ unknowns })}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => update({ unknowns: "Nie wskazuję dodatkowych pytań na tym etapie" })}
      >
        Nie wskazuję dodatkowych pytań na tym etapie
      </Button>
      <ProjectField
        id="review-question"
        label="O co zapytasz przed zaproszeniem?"
        hint="Wymagane, gdy prosisz o doprecyzowanie."
        value={content.question}
        error={errors.question}
        onChange={(question) => update({ question })}
      />
      <ProjectSelect
        id="review-nextStep"
        label="Kolejny krok"
        value={content.nextStep}
        error={errors.nextStep}
        onChange={(nextStep) => update({ nextStep: nextStep as ReviewContent["nextStep"] })}
        options={Object.entries(nextStepLabels).map(([value, label]) => ({ value, label }))}
      />
      <ProjectField
        id="review-rationale"
        label="Uzasadnienie kolejnego kroku"
        value={content.rationale}
        error={errors.rationale}
        onChange={(rationale) => update({ rationale })}
      />
      <Button type="submit">Zapisz wniosek</Button>
    </form>
  );
}
function SavedReview({ review, application }: { review: ProjectReview; application: Application }) {
  const { state } = usePrototype();
  const version = application.contribution?.versions.find((v) => v.version === review.cardVersion);
  const bases = evidenceOptions(version);
  const label = (value: string) => bases.find((b) => b.value === value)?.label ?? value;
  return (
    <section className="project-saved-review">
      <p role="status" id={`saved-review-${review.id}`} tabIndex={-1}>
        <strong>Wniosek zapisany</strong>
      </p>
      <p className="record-caption">
        {state.people.find((p) => p.id === review.authorId)?.name} ·{" "}
        {new Date(review.savedAt ?? review.updatedAt).toLocaleString("pl-PL")} ·{" "}
        {review.cardVersion === null ? "bez karty" : `wersja karty ${review.cardVersion}`}
      </p>
      <dl>
        {(
          [
            ["own", "Własny wkład"],
            ["team", "Praca innych osób"],
            ["result", "Rezultat"],
          ] as const
        ).map(([key, title]) => (
          <div key={key}>
            <dt>{title}</dt>
            <dd>
              {review.content[key].text}
              <p className="record-caption">
                Podstawa: {review.content[key].bases.map(label).join("; ")}
              </p>
            </dd>
          </div>
        ))}
        <div>
          <dt>Odniesienie do roli</dt>
          <dd>
            {review.content.unable ? (
              "Nie mogę ocenić"
            ) : (
              <>
                {review.content.requirement}
                <br />
                {review.content.interpretation}
                <p className="record-caption">Podstawa: {label(review.content.fragment)}</p>
              </>
            )}
          </dd>
        </div>
        <div>
          <dt>Niewiadome</dt>
          <dd>{review.content.unknowns}</dd>
        </div>
        {review.content.question && (
          <div>
            <dt>Pytanie przed zaproszeniem</dt>
            <dd>{review.content.question}</dd>
          </div>
        )}
        <div>
          <dt>Kolejny krok</dt>
          <dd>
            {review.content.nextStep && nextStepLabels[review.content.nextStep]}
            <p>{review.content.rationale}</p>
          </dd>
        </div>
      </dl>
      {review.mode !== "standard" && (
        <p className="record-caption">
          E01, format {review.mode}. Otwarcia podstaw: {review.sourceOpens}. Czas do zapisu:{" "}
          {Math.max(
            0,
            Math.round(
              (Date.parse(review.savedAt ?? review.updatedAt) - Date.parse(review.startedAt)) /
                1000,
            ),
          )}{" "}
          s (obejmuje przerwy). To dane pomocnicze; odpowiedzi wymagają kodowania według klucza.
        </p>
      )}
    </section>
  );
}
