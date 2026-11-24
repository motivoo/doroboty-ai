import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { initialState, transition, type Action, type State } from "./model";
import { parseState, readState, saveState, type StoragePort } from "./storage";
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
  const [blocked, setBlocked] = useState(loaded.blocked);
  const latest = useRef(state);
  function commit(
    next: State,
    replace = false,
    requirePersistence = false,
    failureMessage = "Nie udało się zapisać zmian. Spróbuj ponownie. Szkic pozostaje dostępny.",
  ) {
    if (requirePersistence) {
      if (blocked) {
        setError("Najpierw odzyskaj zapis w ustawieniach. Szkic pozostaje dostępny.");
        return false;
      }
      try {
        saveState(browserStorage(), next);
      } catch (e) {
        setIssue((e as Error).message);
        setError(failureMessage);
        return false;
      }
    }
    latest.current = next;
    setState(next);
    setError("");
    if (blocked && !replace) return true;
    try {
      if (!requirePersistence) saveState(browserStorage(), next);
      setIssue("");
      if (replace) setBlocked(false);
    } catch (e) {
      setIssue((e as Error).message);
    }
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
    try {
      const next = { ...parseState(raw), preparedExamplesVersion: 1 as const };
      commit(next, true);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
  return {
    state,
    issue,
    error,
    blocked,
    original: loaded.original,
    run,
    importState,
    clearError: () => setError(""),
    reset: () => commit(initialState(), true),
  };
}
type Store = ReturnType<typeof useStore>;
const Context = createContext<Store | null>(null);
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function usePrototype() {
  const store = useContext(Context);
  if (!store) throw new Error("PrototypeProvider is required");
  return store;
}
