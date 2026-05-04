import { useCallback, useEffect, useRef, useState } from 'react';

import { ummApi } from '@api/ummApi';
import {
  UmmDisciplineFilters,
  UmmMaterialKind,
  UmmMaterialShortDto,
} from '@entities/ummRequest';

const SEARCH_DEBOUNCE_MS = 350;

type State = {
  materials: UmmMaterialShortDto[];
  sections: string[];
  isLoading: boolean;
  error: string | null;
};

const emptyFilters = (): UmmDisciplineFilters => ({
  materialKind: null,
  section: null,
  search: '',
});

export const useUmmDiscipline = (disciplineId: number | null) => {
  const [state, setState] = useState<State>({
    materials: [],
    sections: [],
    isLoading: false,
    error: null,
  });
  const [filters, setFilters] = useState<UmmDisciplineFilters>(() =>
    emptyFilters()
  );
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setPartial = useCallback(
    (patch: Partial<State>) => setState((prev) => ({ ...prev, ...patch })),
    []
  );

  const loadSections = useCallback(
    async (id: number) => {
      try {
        const sections = await ummApi.getSectionsForDiscipline(id);
        setPartial({ sections });
      } catch {
        setPartial({ sections: [] });
      }
    },
    [setPartial]
  );

  const load = useCallback(
    async (id: number, next: UmmDisciplineFilters) => {
      setPartial({ isLoading: true, error: null });
      try {
        const materials = await ummApi.list({
          disciplineId: id,
          materialKind: next.materialKind ?? undefined,
          section: next.section ?? undefined,
          search: next.search.trim() || undefined,
        });
        setPartial({ materials, isLoading: false });
      } catch {
        setPartial({
          error: 'Не удалось загрузить материалы',
          isLoading: false,
        });
      }
    },
    [setPartial]
  );

  const scheduleSearchLoad = useCallback(
    (id: number, next: UmmDisciplineFilters) => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
      searchTimerRef.current = setTimeout(() => {
        void load(id, next);
      }, SEARCH_DEBOUNCE_MS);
    },
    [load]
  );

  const updateFilters = useCallback(
    (patch: Partial<UmmDisciplineFilters>) => {
      if (disciplineId == null) return;
      setFilters((prev) => {
        const next = { ...prev, ...patch };
        const searchOnly =
          Object.keys(patch).length === 1 && 'search' in patch;
        if (searchOnly) {
          scheduleSearchLoad(disciplineId, next);
        } else {
          void load(disciplineId, next);
        }
        return next;
      });
    },
    [disciplineId, load, scheduleSearchLoad]
  );

  const resetFilters = useCallback(() => {
    if (disciplineId == null) return;
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    const fresh = emptyFilters();
    setFilters(fresh);
    void load(disciplineId, fresh);
  }, [disciplineId, load]);

  const reload = useCallback(() => {
    if (disciplineId == null) return;
    void load(disciplineId, filters);
  }, [disciplineId, filters, load]);

  const setMaterialKind = useCallback(
    (kind: UmmMaterialKind | null) => {
      updateFilters({ materialKind: kind });
    },
    [updateFilters]
  );

  const refreshSections = useCallback(() => {
    if (disciplineId != null) {
      void loadSections(disciplineId);
    }
  }, [disciplineId, loadSections]);

  useEffect(() => {
    if (disciplineId == null || Number.isNaN(disciplineId)) return;

    const fresh = emptyFilters();
    setFilters(fresh);
    void loadSections(disciplineId);
    void load(disciplineId, fresh);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    };
  }, [disciplineId, load, loadSections]);

  return {
    ...state,
    filters,
    updateFilters,
    resetFilters,
    reload,
    setMaterialKind,
    refreshSections,
  };
};
