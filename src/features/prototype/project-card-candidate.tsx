import { useLayoutEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowRight, FilePlus2, Check, Trash2 } from "lucide-react";
import { BackLink } from "@/components/back-link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { JobDescription } from "@/features/jobs/job-description";
import { currentPerson, type Application } from "./model";
import { NotFound } from "./shell";
import { usePrototype } from "./store";
import { ProjectField, ProjectSelect } from "./project-card-fields";
import { ProjectReading } from "./project-card-reading";
import {
  emptyProject,
  projectErrors,
  rawSection,
  sectionKeys,
  sectionLabels,
  sharedProjectVersion,
  type ProjectContent,
  type SectionKey,
} from "./project-card-model";

const posthogConfigured = Boolean(
  import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN && import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
);

export function ProjectInvitation({
  application,
  onSkip,
}: {
  application: Application;
  onSkip?: () => void;
}) {
  const { state, run } = usePrototype();
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const [removalError, setRemovalError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const editRef = useRef<HTMLAnchorElement>(null);
  const removeRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<"heading" | "edit" | "remove" | "confirm" | null>(null);
  useLayoutEffect(() => {
    const targets = { heading: headingRef, edit: editRef, remove: removeRef, confirm: confirmRef };
    if (pendingFocus.current) targets[pendingFocus.current].current?.focus();
    pendingFocus.current = null;
  }, [confirmingRemoval, application.contribution]);
  const company = state.companies.find((c) => c.id === application.companyId);
  const shared = sharedProjectVersion(application);
  const draft = application.contribution?.draft;
  const removed = application.contribution?.removed;
  return (
    <section className="record-sheet project-invitation" aria-label="Karta projektu do aplikacji">
      <span className="project-eyebrow">
        <FilePlus2 size={18} aria-hidden="true" />{" "}
        {shared ? "Karta dołączona do aplikacji" : "Dobrowolne uzupełnienie aplikacji"}
      </span>
      <h2 ref={headingRef} tabIndex={-1}>
        {removed
          ? "Karta została usunięta z aplikacji"
          : shared
            ? shared.content.name
            : "Pokaż swój udział w podobnym projekcie"}
      </h2>
      <p>
        {removed
          ? "Wysłana aplikacja pozostaje bez zmian. Możesz cofnąć usunięcie albo dodać nowy projekt."
          : shared
            ? `Udostępniona wersja ${shared.version} · ${new Date(shared.at).toLocaleString("pl-PL")}. ${draft ? "Szkic zmian czeka na Twoje zatwierdzenie." : "Możesz edytować kartę."}`
            : "Opisz jeden projekt związany z tą rolą. Osoba prowadząca rekrutację zobaczy, co zrobiłeś osobiście, co zrobił zespół i na jakich materiałach opiera się opis. Przeczytasz kartę przed jej udostępnieniem."}
      </p>
      <p className="record-caption">
        Odbiorca: zespół rekrutujący w {company?.name} · {application.jobTitle}.
      </p>
      {!shared && (
        <p className="record-caption">
          Aplikacja jest już wysłana. Brak karty nie zmienia jej oceny ani statusu.
        </p>
      )}
      {confirmingRemoval ? (
        <div className="record-withdrawal" role="group" aria-label="Potwierdzenie usunięcia karty">
          <p>
            Usunąć kartę i jej szkic z tej aplikacji? Wysłana aplikacja pozostanie. Wcześniejsze
            wnioski rekrutera zachowają wersję, na której powstały.
          </p>
          <div className="record-actions">
            <Button
              ref={confirmRef}
              variant="destructive"
              onClick={() => {
                if (run({ type: "project_remove", applicationId: application.id })) {
                  pendingFocus.current = "heading";
                  setConfirmingRemoval(false);
                  setRemovalError("");
                } else setRemovalError("Nie udało się usunąć karty. Spróbuj ponownie.");
              }}
            >
              Potwierdź usunięcie
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                pendingFocus.current = "remove";
                setConfirmingRemoval(false);
                setRemovalError("");
              }}
            >
              Anuluj
            </Button>
          </div>
          {removalError && (
            <p className="error-message" role="alert">
              {removalError}
            </p>
          )}
        </div>
      ) : (
        <div className="record-actions">
          <Link
            ref={editRef}
            to={`/app/aplikacje/${application.id}/projekt`}
            className={buttonVariants()}
          >
            {shared || draft ? "Edytuj" : "Dodaj projekt"}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          {(shared || draft) && (
            <Button
              ref={removeRef}
              variant="outline"
              onClick={() => {
                pendingFocus.current = "confirm";
                setConfirmingRemoval(true);
                setRemovalError("");
              }}
            >
              <Trash2 size={16} aria-hidden="true" />
              Usuń kartę
            </Button>
          )}
          {removed && (
            <Button
              variant="outline"
              onClick={() => {
                pendingFocus.current = "edit";
                if (!run({ type: "project_restore", applicationId: application.id }))
                  pendingFocus.current = null;
              }}
            >
              Cofnij usunięcie
            </Button>
          )}
          {onSkip && (
            <Button variant="ghost" onClick={onSkip}>
              Teraz nie
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

export function CandidateProjectPage() {
  const { id } = useParams();
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  const application = state.applications.find((a) => a.id === id && a.candidateId === person.id);
  if (!application) return <NotFound />;
  return <ProjectEditor key={application.id} application={application} />;
}
function ProjectEditor({ application }: { application: Application }) {
  const { state, run } = usePrototype();
  const navigate = useNavigate();
  const latest = sharedProjectVersion(application);
  const [content, setContent] = useState<ProjectContent>(() =>
    structuredClone(application.contribution?.draft?.content ?? latest?.content ?? emptyProject()),
  );
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [approved, setApproved] = useState(false);
  const [message, setMessage] = useState("");
  const [proposal, setProposal] = useState<Record<SectionKey, string> | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const company = state.companies.find((c) => c.id === application.companyId);
  const job = state.jobs.find((j) => j.id === application.jobId);
  function update(value: ProjectContent) {
    setContent(value);
    setApproved(false);
    setMessage("");
    setErrors({});
    run({ type: "project_draft", applicationId: application.id, content: value });
  }
  function field<K extends keyof ProjectContent>(key: K, value: ProjectContent[K]) {
    update({ ...content, [key]: value, presentation: undefined });
  }
  function go(next: number) {
    setStep(next);
    setMessage("");
    requestAnimationFrame(() => {
      heading.current?.focus();
      heading.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }
  function validate(materials: boolean) {
    const found = projectErrors(content, materials);
    if (materials && content.availability === "unavailable" && content.materials.length)
      found.materials =
        "Usuń materiały, których nie chcesz udostępniać, albo zmień odpowiedź o dostępności.";
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() =>
        document.getElementById(`project-${Object.keys(found)[0]}`)?.focus(),
      );
      return false;
    }
    return true;
  }
  function save() {
    if (run({ type: "project_draft", applicationId: application.id, content }, true))
      setMessage("Szkic zapisany. Zobaczysz go po powrocie; rekruter go nie widzi.");
  }
  function preview() {
    if (!validate(true)) return;
    if (
      run({ type: "project_draft", applicationId: application.id, content }) &&
      run({ type: "project_preview", applicationId: application.id })
    ) {
      setApproved(false);
      go(3);
    }
  }
  const input = (
    key:
      | "name"
      | "problem"
      | "own"
      | "team"
      | "decision"
      | "result"
      | "resultBasis"
      | "limits"
      | "unavailableReason",
    label: string,
    hint?: string,
  ) => (
    <ProjectField
      id={`project-${key}`}
      key={key}
      label={label}
      hint={hint}
      error={errors[key]}
      short={key === "name"}
      maxLength={key === "name" ? 200 : 12000}
      value={content[key]}
      onChange={(value) => field(key, value)}
    />
  );
  const select = (
    key: "teamMode" | "decisionMode" | "resultMode" | "resultBasisMode" | "availability",
    label: string,
    values: [string, string][],
  ) => (
    <ProjectSelect
      id={`project-${key}`}
      label={label}
      value={content[key]}
      error={errors[key]}
      onChange={(value) => field(key, value as ProjectContent[typeof key])}
      options={values.map(([value, label]) => ({ value, label }))}
    />
  );
  return (
    <article className="project-page project-candidate-page">
      <BackLink to={`/app/aplikacje/${application.id}`}>Wróć do aplikacji</BackLink>
      <header className="project-page-header">
        <span className="project-eyebrow">
          Karta projektu · {latest ? `szkic wersji ${latest.version + 1}` : "tylko dla Ciebie"}
        </span>
        <h1>Pokaż swoją część pracy.</h1>
        <p>Jeden projekt, własny zakres i materiały, którymi możesz się podzielić.</p>
      </header>
      <div className="project-candidate-layout">
        <aside
          className="record-sheet project-context project-candidate-context"
          aria-label="Kontekst aplikacji"
        >
          <div>
            <h2>{application.jobTitle}</h2>
            <p>{company?.name} · odbiorca: zespół rekrutujący</p>
          </div>
          <details>
            <summary>Zadania i wymagania roli</summary>
            <div
              className="project-job-description"
              tabIndex={0}
              role="region"
              aria-label="Opis stanowiska"
              onKeyDown={(event) => {
                if (
                  event.target !== event.currentTarget ||
                  event.altKey ||
                  event.ctrlKey ||
                  event.metaKey ||
                  event.shiftKey
                )
                  return;
                if (event.key === "Home" || event.key === "End") {
                  event.preventDefault();
                  event.currentTarget.scrollTop =
                    event.key === "Home" ? 0 : event.currentTarget.scrollHeight;
                }
              }}
            >
              <JobDescription description={job?.description ?? "Opis roli niedostępny."} compact />
            </div>
          </details>
        </aside>
        <div className="project-candidate-work">
          <ol className="project-steps" aria-label="Etapy przygotowania karty">
            {["Projekt i wkład", "Materiały", "Podgląd i zgoda"].map((label, index) => (
              <li key={label} aria-current={step === index + 1 ? "step" : undefined}>
                <span>{step > index + 1 ? <Check size={16} aria-hidden="true" /> : index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          <section className="record-sheet project-editor">
            <h2 tabIndex={-1} ref={heading}>
              {step === 1
                ? "Twój projekt i wkład"
                : step === 2
                  ? "Materiał pokazujący Twoją pracę"
                  : "Tak zobaczy to rekruter"}
            </h2>
            <p className="record-caption">
              {step === 3
                ? "Sprawdź podział pracy, rezultat i materiały. Zatwierdzasz wyłącznie aktualną wersję."
                : "Możesz zapisać szkic w dowolnym momencie. Wymagane odpowiedzi dotyczą tylko udostępnienia karty."}
            </p>
            {step === 1 && (
              <div className="project-form-fields">
                {input("name", "Nazwa projektu", "Możesz użyć opisu zamiast nazwy klienta.")}
                {input(
                  "problem",
                  "Jaki problem rozwiązywaliście?",
                  "Co miało się zmienić i dla kogo?",
                )}
                {input(
                  "own",
                  "Za co odpowiadałeś osobiście?",
                  "Opisz działania, które wykonałeś sam. Oddziel je od pracy innych osób.",
                )}
                {select("teamMode", "Co zrobiły inne osoby?", [
                  ["description", "Opiszę podział pracy"],
                  ["solo", "Projekt samodzielny"],
                  ["unknown", "Nie wiem"],
                ])}
                {content.teamMode === "description" &&
                  input(
                    "team",
                    "Podział pracy w zespole",
                    "Nie podawaj danych osobowych współpracowników.",
                  )}
                {select("decisionMode", "Jaką decyzję podjąłeś i dlaczego?", [
                  ["description", "Opiszę decyzję i uzasadnienie"],
                  ["none", "Nie potrafię wskazać osobnej decyzji"],
                ])}
                {content.decisionMode === "description" &&
                  input(
                    "decision",
                    "Twoja decyzja i uzasadnienie",
                    "Wyjaśnij wybór dotyczący Twojej części pracy.",
                  )}
                {select("resultMode", "Jaki był rezultat?", [
                  ["description", "Opiszę rezultat"],
                  ["unknown", "Nie znam rezultatu"],
                ])}
                {content.resultMode === "description" && (
                  <>
                    {input(
                      "result",
                      "Opis rezultatu",
                      "Oddziel to, co powstało, od efektu, który rzeczywiście zaobserwowano.",
                    )}
                    {select("resultBasisMode", "Skąd wiesz, jaki był rezultat?", [
                      ["description", "Wskażę obserwację lub materiał"],
                      ["none", "Nie mam danych"],
                    ])}
                    {content.resultBasisMode === "description" &&
                      input(
                        "resultBasis",
                        "Obserwacja lub materiał potwierdzający rezultat",
                        "Nie musisz podawać liczby.",
                      )}
                  </>
                )}
                {input(
                  "limits",
                  "Czego nie możesz ujawnić lub ustalić?",
                  "Opcjonalnie: np. poufne dane klienta albo brak informacji o dalszym użyciu.",
                )}
              </div>
            )}
            {step === 2 && (
              <div className="project-form-fields">
                {select("availability", "Czy możesz pokazać materiał?", [
                  ["yes", "Tak"],
                  ["redacted", "Tylko opis lub fragment po anonimizacji"],
                  ["unavailable", "Nie mogę udostępnić materiału"],
                ])}
                {content.availability === "unavailable" ? (
                  <>
                    {input(
                      "unavailableReason",
                      "Dlaczego materiał jest niedostępny?",
                      "Opcjonalnie. Brak materiału będzie widoczny jako ograniczenie.",
                    )}
                    {content.materials.length > 0 && (
                      <Button variant="outline" onClick={() => field("materials", [])}>
                        Usuń materiały ze szkicu
                      </Button>
                    )}
                  </>
                ) : (
                  content.availability && (
                    <>
                      <p className="record-caption">
                        Wklej dozwolony fragment lub podaj link i dokładną lokalizację. Adres nie
                        potwierdza dostępności ani autorstwa. Używaj wyłącznie przykładowych danych.
                      </p>
                      {content.materials.map((material, index) => {
                        const change = (value: Partial<typeof material>) =>
                          field(
                            "materials",
                            content.materials.map((m) =>
                              m.id === material.id ? { ...m, ...value } : m,
                            ),
                          );
                        const materialInput = (
                          key: "name" | "value" | "location" | "shows" | "support",
                          label: string,
                          short = false,
                        ) => (
                          <ProjectField
                            id={`project-material-${index}-${key}`}
                            label={label}
                            short={short}
                            error={errors[`material-${index}-${key}`]}
                            value={material[key]}
                            onChange={(value) => change({ [key]: value })}
                          />
                        );
                        return (
                          <fieldset className="project-material-editor" key={material.id}>
                            <legend>
                              Materiał {index + 1}
                              {content.availability === "redacted" ? " · po anonimizacji" : ""}
                            </legend>
                            {materialInput("name", "Nazwa materiału", true)}
                            <ProjectSelect
                              id={`material-kind-${index}`}
                              label="Rodzaj materiału"
                              value={material.kind}
                              onChange={(value) =>
                                change({ kind: value as "link" | "excerpt", value: "" })
                              }
                              options={[
                                { value: "link", label: "Link" },
                                { value: "excerpt", label: "Wklejony fragment" },
                              ]}
                            />
                            {materialInput(
                              "value",
                              material.kind === "link" ? "Link do materiału" : "Fragment materiału",
                              material.kind === "link",
                            )}
                            {materialInput("location", "Gdzie dokładnie zajrzeć?")}
                            <ProjectSelect
                              id={`material-target-${index}`}
                              label="Powiązane pole karty"
                              value={material.target}
                              onChange={(value) => change({ target: value as SectionKey })}
                              options={sectionKeys.map((value) => ({
                                value,
                                label: sectionLabels[value],
                              }))}
                            />
                            {materialInput("shows", "Co ten materiał pokazuje?")}
                            {materialInput("support", "Jakiego wsparcia użyłeś przy tej części?")}
                            <Button
                              variant="ghost"
                              onClick={() =>
                                field(
                                  "materials",
                                  content.materials.filter((m) => m.id !== material.id),
                                )
                              }
                            >
                              Usuń materiał {index + 1}
                            </Button>
                          </fieldset>
                        );
                      })}
                      <Button
                        variant="outline"
                        disabled={content.materials.length >= 10}
                        onClick={() =>
                          field("materials", [
                            ...content.materials,
                            {
                              id: crypto.randomUUID(),
                              name: "",
                              kind: "excerpt",
                              value: "",
                              location: "",
                              target: "own",
                              shows: "",
                              support: "",
                            },
                          ])
                        }
                      >
                        Dodaj materiał
                      </Button>
                    </>
                  )
                )}
                {errors.materials && (
                  <p id="project-materials" tabIndex={-1} className="error-message" role="alert">
                    {errors.materials}
                  </p>
                )}
              </div>
            )}
            {step === 3 && (
              <>
                <div className="project-ai">
                  <p className="record-caption">
                    Pomoc AI jest symulowana: porządkuje wyłącznie aktualnie podane treści. Użycie
                    tej pomocy jest odrębne od użycia AI w opisywanym projekcie.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      try {
                        setProposal(
                          Object.fromEntries(
                            sectionKeys.map((key) => [
                              key,
                              rawSection(content, key)
                                .trim()
                                .replace(/[\t ]+/g, " "),
                            ]),
                          ) as Record<SectionKey, string>,
                        );
                      } catch {
                        setMessage(
                          "Nie udało się uporządkować opisu. Możesz spróbować ponownie lub przygotować kartę bez AI.",
                        );
                      }
                    }}
                  >
                    Uporządkuj opis z AI
                  </Button>
                  {proposal && (
                    <div className="project-form-fields">
                      <h3>Propozycja do Twojej korekty</h3>
                      {sectionKeys.map((key) => (
                        <ProjectField
                          id={`proposal-${key}`}
                          key={key}
                          label={sectionLabels[key]}
                          value={proposal[key]}
                          onChange={(value) => setProposal({ ...proposal, [key]: value })}
                        />
                      ))}
                      <div className="record-actions">
                        <Button
                          disabled={sectionKeys.some((key) => !proposal[key].trim())}
                          onClick={() => {
                            update({ ...content, presentation: proposal });
                            setProposal(null);
                            setApproved(false);
                            go(2);
                          }}
                        >
                          Użyj propozycji i przejdź ponownie do podglądu
                        </Button>
                        <Button variant="ghost" onClick={() => setProposal(null)}>
                          Odrzuć propozycję
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <ProjectReading content={content} />
                <div className="project-approval">
                  <p>
                    Udostępnisz kartę zespołowi rekrutującemu w <strong>{company?.name}</strong>, w
                    aplikacji na <strong>{application.jobTitle}</strong>.
                  </p>
                  <label className="application-consent">
                    <Checkbox checked={approved} onCheckedChange={setApproved} />
                    <span>
                      Sprawdziłem opis mojego wkładu i materiały przeznaczone do udostępnienia
                    </span>
                  </label>
                </div>
              </>
            )}
            <footer className="record-footer">
              <div className="record-actions">
                {step === 1 && (
                  <Button
                    onClick={() => {
                      if (validate(false)) {
                        save();
                        go(2);
                      }
                    }}
                  >
                    Dalej: materiał
                    <ArrowRight size={16} aria-hidden="true" />
                  </Button>
                )}
                {step === 2 && <Button onClick={preview}>Przejdź do podglądu</Button>}
                {step === 3 && (
                  <Button
                    disabled={!approved || Boolean(proposal)}
                    onClick={() => {
                      if (run({ type: "project_share", applicationId: application.id, approved })) {
                        if (posthogConfigured) posthog.capture("project_card_shared");
                        navigate(`/app/aplikacje/${application.id}?karta=1`);
                      }
                    }}
                  >
                    Zatwierdź i udostępnij kartę
                  </Button>
                )}
                <Button variant="outline" onClick={save}>
                  Zapisz szkic
                </Button>
                {step > 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setApproved(false);
                      setProposal(null);
                      go(step === 3 ? 1 : step - 1);
                    }}
                  >
                    {step === 3 ? "Popraw opis" : "Wstecz"}
                  </Button>
                )}
              </div>
              {errors.presentation && (
                <p className="error-message" role="alert">
                  {errors.presentation}{" "}
                  <Button
                    variant="ghost"
                    onClick={() => update({ ...content, presentation: undefined })}
                  >
                    Przywróć odpowiedzi źródłowe
                  </Button>
                </p>
              )}
              <p role="status" className="project-message">
                {message}
              </p>
              {latest && (
                <p className="record-caption">
                  Rekruter nadal widzi zatwierdzoną wersję {latest.version}. Ten szkic nie zastąpi
                  jej przed udostępnieniem.
                </p>
              )}
            </footer>
          </section>
        </div>
      </div>
    </article>
  );
}
