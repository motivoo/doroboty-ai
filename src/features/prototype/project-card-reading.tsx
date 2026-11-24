import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  displayedSection,
  rawSection,
  safeMaterialURL,
  sectionKeys,
  sectionLabels,
  type ProjectContent,
  type SectionKey,
} from "./project-card-model";

export function ProjectReading({
  content,
  onSourceOpen,
  flat = false,
}: {
  content: ProjectContent;
  onSourceOpen?: () => void;
  flat?: boolean;
}) {
  const [selected, setSelected] = useState<SectionKey>("own");
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const materials = content.materials.filter((m) => m.target === selected);
  return (
    <Dialog>
      <div className={flat ? "project-flat" : "project-claims"}>
        <header className="project-reading-title">
          <span className="project-eyebrow">
            {flat ? "Odpowiedź o projekcie i portfolio" : "Wkład w projekt"}
          </span>
          <h2>{content.name}</h2>
          <p className="record-caption">
            Opis zatwierdzony przez kandydata. Portal nie sprawdza autorstwa ani kompetencji.
          </p>
        </header>
        {sectionKeys.map((key) => {
          const linked = content.materials.filter((m) => m.target === key);
          return (
            <section key={key} className="project-claim" aria-label={sectionLabels[key]}>
              <h3>{sectionLabels[key]}</h3>
              <p>{displayedSection(content, key)}</p>
              <div className="project-provenance">
                <span>{key === "limits" && !content.limits ? "Nie podano" : "Opis kandydata"}</span>
                {linked.length > 0 && <span>Wskazany fragment materiału</span>}
                {content.availability === "unavailable" && <span>Materiał niedostępny</span>}
              </div>
              <DialogTrigger
                aria-label={`Pokaż podstawę opisu: ${sectionLabels[key]}`}
                render={<Button variant="ghost" size="sm" />}
                onClick={() => {
                  setSelected(key);
                  onSourceOpen?.();
                }}
              >
                Pokaż podstawę opisu<span className="sr-only">: {sectionLabels[key]}</span>
              </DialogTrigger>
            </section>
          );
        })}
        <section className="project-claim" aria-label="Materiały">
          <h3>Materiały</h3>
          {content.availability === "unavailable" ? (
            <p>
              Nie mogę udostępnić materiału
              {content.unavailableReason ? ` — ${content.unavailableReason}` : "."}
            </p>
          ) : (
            <ul className="project-material-list">
              {content.materials.map((material) => (
                <li key={material.id}>
                  <strong>{material.name}</strong>
                  <p>{material.shows}</p>
                  <p className="record-caption">
                    {sectionLabels[material.target]} · {material.location}
                  </p>
                  {content.availability === "redacted" && (
                    <p className="record-caption">
                      Materiał po anonimizacji; nie jest przedstawiany jako oryginał.
                    </p>
                  )}
                  <DialogTrigger
                    render={<Button variant="outline" size="sm" />}
                    onClick={() => {
                      setSelected(material.target);
                      onSourceOpen?.();
                    }}
                  >
                    Zobacz materiał: {material.name}
                  </DialogTrigger>
                </li>
              ))}
            </ul>
          )}
          <p className="record-caption">
            Powiązania z materiałami są deklaracją kandydata i nie potwierdzają autorstwa.
          </p>
        </section>
      </div>
      <DialogContent className="project-source-drawer">
        <DialogTitle>Pokaż podstawę opisu</DialogTitle>
        <DialogDescription>
          {sectionLabels[selected]} — odpowiedź kandydata i wskazane materiały.
        </DialogDescription>
        <div className="project-source-scroll">
          <h3>Powiązane twierdzenie</h3>
          <p>{displayedSection(content, selected)}</p>
          <h3>Opis kandydata</h3>
          <p>{rawSection(content, selected)}</p>
          {!materials.length && (
            <p className="record-caption">
              {content.availability === "unavailable"
                ? `Materiał niedostępny. ${content.unavailableReason}`
                : "Do tej części nie wskazano materiału. Podstawą jest odpowiedź kandydata."}
            </p>
          )}
          {materials.map((material) => (
            <section className="project-source-material" key={material.id}>
              <h3>{material.name}</h3>
              <p className="record-caption">
                {content.availability === "redacted"
                  ? "Fragment po anonimizacji"
                  : "Materiał wskazany przez kandydata"}
              </p>
              <p>
                <strong>Gdzie dokładnie zajrzeć?</strong>
                <br />
                {material.location}
              </p>
              <p>
                <strong>Co ten materiał pokazuje?</strong>
                <br />
                {material.shows}
              </p>
              {material.support && (
                <p>
                  <strong>Wsparcie przy tej części</strong>
                  <br />
                  {material.support}
                </p>
              )}
              {material.kind === "excerpt" ? (
                <blockquote>{material.value}</blockquote>
              ) : (
                <>
                  <p className="record-caption">
                    Podgląd zawartości linku jest niedostępny. Otwórz oryginał, aby samodzielnie
                    sprawdzić wskazany fragment.
                  </p>
                  {safeMaterialURL(material.value) && (
                    <a
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                      href={material.value}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Otwórz oryginał<span className="sr-only">: {material.name}</span>
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUnavailable((items) => [...items, material.id])}
                  >
                    Zgłoś niedostępny materiał
                  </Button>
                  {unavailable.includes(material.id) && (
                    <p role="status">
                      Nie udało się wyświetlić materiału. Uwzględnij tę lukę w swoich wnioskach.
                    </p>
                  )}
                </>
              )}
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
