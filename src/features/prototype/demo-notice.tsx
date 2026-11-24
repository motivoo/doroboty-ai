import { Link } from "react-router";

export function DemoNotice() {
  return (
    <aside className="demo-notice" aria-label="Informacja o demonstracji">
      <strong>Demo szkoleniowe.</strong> Oferty, profile i rekrutacja są symulacją. Wpisuj wyłącznie
      dane syntetyczne. Zmiany pozostają w tej przeglądarce. Nie wysyłasz zgłoszenia do prawdziwej
      firmy. <Link to="/pomoc">Pomoc i odzyskiwanie danych</Link>
    </aside>
  );
}
