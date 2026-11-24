import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { downloadText } from "./settings";
import { diagnosticText } from "./diagnostics";

export function HelpPage() {
  return (
    <section className="prototype-section max-w-4xl prototype-help">
      <h1>Pomoc i odzyskiwanie danych</h1>
      <p>
        To demonstracja na danych syntetycznych. Wybór osoby nie zapewnia poufności: plik eksportu
        zawiera cały scenariusz, także notatki innych ról.
      </p>
      <h2>Zachowaj pracę przed zamknięciem strony</h2>
      <p>
        W <Link to="/app/settings">ustawieniach danych</Link> wybierz „Eksportuj dane” po
        zakończeniu ćwiczenia i przed importem, resetem, zmianą adresu lub wersji. Zachowaj plik na
        swoim urządzeniu. Link do strony nie przenosi scenariusza.
      </p>
      <h2>Gdy zapis nie działa</h2>
      <p>
        Wyeksportuj swoją kopię. Jeśli inna karta zapisuje scenariusz, zamknij pozostałe karty i
        odśwież tę stronę dopiero po zachowaniu pracy. Odświeżenie odrzuca niezapisane pola
        formularzy. Przy uszkodzonym zapisie pobierz oryginał w ustawieniach przed decyzją o
        imporcie lub resecie.
      </p>
      <h2>Zgłoś problem bez danych scenariusza</h2>
      <p>
        Na szkoleniu skontaktuj się z prowadzącym. Dla publicznego dema organizator musi podać
        kontakt przy udostępnianym linku; odbiorca zgłoszeń nie jest jeszcze ustalony.
      </p>
      <p>
        Podaj wersję, przeglądarkę, ekran, kroki i oczekiwany wynik. Nie przesyłaj CV, notatek,
        eksportów scenariusza ani zrzutów z danymi osobowymi.
      </p>
      <Button
        variant="outline"
        onClick={() => downloadText("doroboty-diagnostyka.txt", diagnosticText(), "text/plain")}
      >
        Pobierz opis do zgłoszenia
      </Button>
      <p className="diagnostic-version">Wersja: {__APP_BUILD__}</p>
    </section>
  );
}
