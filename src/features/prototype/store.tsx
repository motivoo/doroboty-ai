import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import posthog from "posthog-js";
import { currentPerson, initialState, transition, type Action, type State } from "./model";
import {
  parseState,
  readState,
  saveState,
  StorageConflictError,
  type StoragePort,
} from "./storage";
import { useWriterLock } from "./writer-lock";

const posthogConfigured = Boolean(
  import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN && import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
);
function browserStorage(): StoragePort | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function useStore() {
  const [loaded] = useState(() => readState(browserStorage()));
  const [state, setState] = useState(loaded.state);
  const [issue, setIssue] = useState(loaded.issue);
  const [error, setError] = useState("");
  const [operationMessage, setOperationMessage] = useState("");
  const [blocked, setBlocked] = useState(loaded.blocked);
  const expectedRaw = useRef(loaded.raw);
  const writer = useWriterLock();
  const latest = useRef(state);
  function commit(
    next: State,
    replace = false,
    requirePersistence = false,
    failureMessage = "Nie udało się zapisać zmian. Spróbuj ponownie. Szkic pozostaje dostępny.",
  ) {
    if (!writer.writable.current) {
      setError(writer.issue || "Trwa zabezpieczanie zapisu. Spróbuj ponownie za chwilę.");
      return false;
    }
    if (requirePersistence && blocked && !replace) {
      setError("Najpierw odzyskaj zapis w ustawieniach. Szkic pozostaje dostępny.");
      return false;
    }
    let persistenceIssue = "";
    if (!blocked || replace) {
      try {
        expectedRaw.current = saveState(browserStorage(), next, expectedRaw.current);
      } catch (e) {
        persistenceIssue = (e as Error).message;
        setIssue(persistenceIssue);
        if (requirePersistence || e instanceof StorageConflictError) {
          setError(e instanceof StorageConflictError ? e.message : failureMessage);
          return false;
        }
      }
    }
    latest.current = next;
    setState(next);
    setError("");
    if (blocked && !replace) return true;
    setIssue(persistenceIssue);
    if (replace) setBlocked(false);
    return true;
  }
  function run(action: Action, persist = false) {
    try {
      return commit(
        transition(latest.current, action),
        false,
        persist ||
          action.type === "project_share" ||
          action.type === "project_remove" ||
          action.type === "project_restore" ||
          action.type === "review_save" ||
          (action.type === "review_start" && action.mode !== "standard"),
        action.type === "project_remove" || action.type === "project_restore"
          ? "Nie udało się zapisać zmiany karty. Spróbuj ponownie. Dotychczasowa karta pozostaje bez zmian."
          : action.type === "project_share"
            ? "Nie udało się udostępnić karty. Spróbuj ponownie. Szkic pozostaje dostępny."
            : action.type === "review_save"
              ? "Nie udało się zapisać wniosku. Spróbuj ponownie. Szkic pozostaje dostępny."
              : undefined,
      );
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "ZodError"
          ? e.message
          : "Sprawdź poprawność i długość wprowadzonych danych.",
      );
      return false;
    }
  }
  function importState(raw: string) {
    setOperationMessage("");
    try {
      const next = { ...parseState(raw), preparedExamplesVersion: 1 as const };
      const success = commit(
        next,
        true,
        true,
        "Nie udało się zapisać importu. Dotychczasowe dane pozostają bez zmian.",
      );
      if (success) setOperationMessage("Dane zostały zaimportowane.");
      return success;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
  return {
    ready: writer.ready,
    state,
    issue,
    writeIssue: writer.issue,
    error,
    operationMessage,
    clearOperationMessage: () => setOperationMessage(""),
    blocked,
    original: loaded.original,
    run,
    importState,
    clearError: () => {
      setError("");
      setOperationMessage("");
    },
    reset: () => {
      setOperationMessage("");
      const success = commit(
        initialState(),
        true,
        true,
        "Nie udało się zapisać resetu. Dotychczasowe dane pozostają bez zmian.",
      );
      if (success) setOperationMessage("Przywrócono scenariusz początkowy.");
      return success;
    },
  };
}
type Store = ReturnType<typeof useStore>;
const Context = createContext<Store | null>(null);
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const restoredIdentity = useRef(false);

  useEffect(() => {
    if (restoredIdentity.current || !store.ready) return;

    restoredIdentity.current = true;
    const person = currentPerson(store.state);
    if (posthogConfigured && person)
      posthog.identify(person.id, { name: person.name, role: person.role });
  }, [store.ready, store.state]);

  // Route effects may persist a review immediately on mount. Mount them only
  // after the browser has resolved writer ownership, including read-only mode.
  if (!store.ready) return <p role="status">Przygotowywanie scenariusza…</p>;
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function usePrototype() {
  const store = useContext(Context);
  if (!store) throw new Error("PrototypeProvider is required");
  return store;
}
