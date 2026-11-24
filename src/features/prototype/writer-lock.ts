import { useEffect, useRef, useState } from "react";

export const WRITER_LOCK = "doroboty.prototype.writer.v1";

// Hold one browser-managed lock for this tab's lifetime. Unlike localStorage
// leases, Web Locks serialize writers atomically and release on tab closure.
export function useWriterLock() {
  const writable = useRef(false);
  const [issue, setIssue] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let disposed = false;
    let release = () => {};
    if (!navigator.locks) {
      setIssue(
        "Ta przeglądarka nie obsługuje bezpiecznego zapisu między kartami. Otwórz prototyp przez HTTPS lub lokalny serwer w aktualnej przeglądarce. Odczyt i eksport pozostają dostępne.",
      );
      setReady(true);
      return;
    }
    // StrictMode mounts and cleans up effects before mounting them again.
    // Do not let the discarded effect briefly hold the live mount's lock.
    void Promise.resolve()
      .then(() => {
        if (disposed) return;
        return navigator.locks.request(WRITER_LOCK, { ifAvailable: true }, async (lock) => {
          if (disposed) return;
          if (!lock) {
            setIssue(
              "Inna karta zapisuje ten scenariusz. Ta karta służy tylko do odczytu i eksportu. Zamknij pozostałe karty prototypu, a potem odśwież tę stronę.",
            );
            setReady(true);
            return;
          }
          writable.current = true;
          setIssue("");
          setReady(true);
          await new Promise<void>((resolve) => {
            release = resolve;
          });
        });
      })
      .catch(() => {
        if (!disposed) {
          setIssue("Nie udało się zabezpieczyć zapisu. Odczyt i eksport pozostają dostępne.");
          setReady(true);
        }
      });
    return () => {
      disposed = true;
      writable.current = false;
      release();
    };
  }, []);
  return { writable, issue, ready };
}
