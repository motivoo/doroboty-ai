const events: string[] = [];
export function recordDiagnostic(
  code: "ui-render-failure" | "runtime-error" | "unhandled-rejection",
) {
  events.push(`${new Date().toISOString()} ${code}`);
  if (events.length > 10) events.shift();
}
export function diagnosticText() {
  return [
    "DoRoboty.ai — zgłoszenie problemu (uzupełnij opis przed przekazaniem)",
    `Wersja: ${__APP_BUILD__}`,
    `Czas: ${new Date().toISOString()}`,
    `Sygnały techniczne: ${events.join("; ") || "brak"}`,
    "Przeglądarka i system: [uzupełnij]",
    "Ekran i kroki: [opisz bez danych osobowych i treści formularzy]",
    "Oczekiwany wynik: [uzupełnij]",
    "Zaobserwowany wynik: [uzupełnij]",
    "Nie dołączaj CV, notatek, eksportu scenariusza, haseł ani danych osobowych.",
  ].join("\n");
}
