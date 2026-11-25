import { Component, type ReactNode } from "react";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { STORAGE_KEY } from "./storage";
import { diagnosticText, recordDiagnostic } from "./diagnostics";
import { downloadText } from "./settings";

const posthogConfigured = Boolean(
  import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN && import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
);

export class PrototypeErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; message: string }
> {
  state = { failed: false, message: "" };
  static getDerivedStateFromError() {
    return { failed: true, message: "" };
  }
  componentDidCatch(error: Error) {
    if (posthogConfigured) posthog.captureException(error);
    recordDiagnostic("ui-render-failure");
  }
  exportOriginal = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === null)
        this.setState({ message: "Brak zapisanego scenariusza w tej przeglądarce." });
      else downloadText("doroboty-zapis-do-odzyskania.txt", raw, "text/plain");
    } catch {
      this.setState({
        message:
          "Przeglądarka blokuje odczyt danych. Nie czyść jej pamięci; poproś prowadzącego o pomoc.",
      });
    }
  };
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="prototype-recovery">
        <h1>Nie udało się wyświetlić prototypu</h1>
        <p>
          Nie resetuj danych. Najpierw pobierz zapis, a potem spróbuj odświeżyć stronę. Demo
          przyjmuje wyłącznie dane syntetyczne.
        </p>
        <div className="recovery-actions">
          <Button onClick={this.exportOriginal}>Pobierz zapis do odzyskania</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Odśwież stronę
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadText("doroboty-diagnostyka.txt", diagnosticText(), "text/plain")}
          >
            Pobierz opis do zgłoszenia
          </Button>
        </div>
        <p>
          Szkolenie: przekaż prowadzącemu opis kroków. Publiczne demo: użyj kontaktu podanego przy
          linku do demonstracji. Nie przesyłaj zapisu scenariusza ani treści formularzy.
        </p>
        {this.state.message && <p role="status">{this.state.message}</p>}
        <p className="diagnostic-version">Wersja: {__APP_BUILD__}</p>
      </main>
    );
  }
}
