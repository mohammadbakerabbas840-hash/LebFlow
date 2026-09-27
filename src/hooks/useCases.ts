import { useEffect, useRef, useState } from 'react';
import * as client from '../services/client';
import { apiMode } from '../services/backend';
import { useResource } from './useResource';
import type { RequestKind } from '../data/serviceGuides';
import type { Appointment, Case, PersonalRequest } from '../types/case';
import type { PassportAnswers } from '../features/services/passportRequirements';
export function useCases() {
  const resource = useResource(client.getCases);
  const [cases, setCases] = useState<Case[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  const [mutationError, setMutationError] = useState(false);
  const [pending, setPending] = useState(0);
  const queue = useRef(Promise.resolve());
  const revision = useRef(0);
  useEffect(() => {
    if (resource.data) {
      setCases(resource.data.cases);
      setStorageFailed(resource.data.storageFailed);
      setHydrated(true);
    }
  }, [resource.data]);
  function mutate(operation: () => ReturnType<typeof client.getCases>) {
    const currentRevision = ++revision.current;
    setPending((n) => n + 1);
    setMutationError(false);
    const task = queue.current
      .then(operation)
      .then((result) => {
        if (currentRevision === revision.current) setCases(result.cases);
        setStorageFailed(result.storageFailed);
      })
      .catch((error) => {
        setMutationError(true);
        resource.retry();
        throw error;
      })
      .finally(() => setPending((n) => n - 1));
    queue.current = task.catch(() => {});
    return task;
  }
  const create = (
    id: string,
    kind: RequestKind,
    appointment?: Appointment,
    answers?: PassportAnswers,
    draft?: Partial<PersonalRequest>,
  ) => mutate(() => client.createCase(id, kind, appointment, answers, draft));
  const updateCase = (id: string, patch: Partial<PersonalRequest>) => {
    if (!apiMode)
      setCases((previous) => previous.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    return mutate(() => client.updateCase(id, patch));
  };
  const reminders = cases
    .filter((c) => c.due && c.stage !== 'Completed')
    .sort((a, b) => a.due.localeCompare(b.due));
  const appointments = cases
    .filter((c) => c.appointment)
    .sort((a, b) =>
      `${a.appointment!.date}T${a.appointment!.time}`.localeCompare(
        `${b.appointment!.date}T${b.appointment!.time}`,
      ),
    );
  return {
    cases,
    reminders,
    appointments,
    create,
    updateCase,
    storageFailed,
    dismissStorageError: () => setStorageFailed(false),
    loading: resource.loading || !hydrated,
    error: resource.error || mutationError,
    retry: () => {
      setMutationError(false);
      resource.retry();
    },
    pending: pending > 0,
  };
}
