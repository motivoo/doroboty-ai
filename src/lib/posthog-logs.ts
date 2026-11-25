import posthog from "posthog-js";

type PersonaRole = "candidate" | "employer" | "operator";

type PublishedJob = {
  isNewJob: boolean;
  category: string;
  remoteStatus: string;
};

export function logPostHogInitialized() {
  posthog.logger.info("PostHog client initialized", {
    log_source: "posthog_exporter",
  });
}

export function logPersonaSelected(role: PersonaRole) {
  posthog.logger.info("Prototype persona selected", {
    log_source: "posthog_exporter",
    role,
  });
}

export function logJobPublished({ isNewJob, category, remoteStatus }: PublishedJob) {
  posthog.logger.info("Job published", {
    log_source: "posthog_exporter",
    is_new_job: isNewJob,
    job_category: category,
    remote_status: remoteStatus,
  });
}
