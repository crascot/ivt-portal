import { useCallback, useEffect, useRef, useState } from 'react';

import { ummApi } from '@api/ummApi';
import { scheduleApi } from '@api/scheduleApi';
import {
  UmmCatalogFilters,
  UmmCreatePayload,
  UmmMaterialShortDto,
  UmmUpdatePayload,
} from '@entities/ummRequest';
import { DisciplineShort, TeacherShort } from '@entities/scheduleRequest';

const SEARCH_DEBOUNCE_MS = 350;

type State = {
  materials: UmmMaterialShortDto[];
  disciplines: DisciplineShort[];
  teachers: TeacherShort[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  actionError: string | null;
};

const initialState: State = {
  materials: [],
  disciplines: [],
  teachers: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  actionError: null,
};

export const emptyUmmCatalogFilters: UmmCatalogFilters = {
  authorId: null,
  search: '',
};

function shouldFetchMaterials(filters: UmmCatalogFilters): boolean {
  return Boolean(filters.search.trim()) || filters.authorId != null;
}

export const useUmmList = () => {
  const [state, setState] = useState<State>(initialState);
  const [filters, setFilters] = useState<UmmCatalogFilters>(
    emptyUmmCatalogFilters
  );
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setPartial = useCallback(
    (patch: Partial<State>) => setState((prev) => ({ ...prev, ...patch })),
    []
  );

  const load = useCallback(
    async (next: UmmCatalogFilters) => {
      if (!shouldFetchMaterials(next)) {
        setPartial({ materials: [], isLoading: false, error: null });
        return;
      }
      setPartial({ isLoading: true, error: null });
      try {
        const materials = await ummApi.list({
          authorId: next.authorId,
          search: next.search,
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

  const loadMeta = useCallback(async () => {
    try {
      const [disciplines, teachers] = await Promise.all([
        scheduleApi.getDisciplines(),
        scheduleApi.getTeachers(),
      ]);
      setPartial({ disciplines, teachers });
    } catch {
      // not critical for list rendering
    }
  }, [setPartial]);

  const updateFilters = useCallback(
    (patch: Partial<UmmCatalogFilters>) => {
      setFilters((prev) => {
        const next = { ...prev, ...patch };
        const isSearchOnlyChange =
          Object.keys(patch).length === 1 && 'search' in patch;

        if (searchTimerRef.current) {
          clearTimeout(searchTimerRef.current);
          searchTimerRef.current = null;
        }

        if (isSearchOnlyChange) {
          searchTimerRef.current = setTimeout(() => {
            void load(next);
          }, SEARCH_DEBOUNCE_MS);
        } else {
          void load(next);
        }
        return next;
      });
    },
    [load]
  );

  const resetFilters = useCallback(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    setFilters(emptyUmmCatalogFilters);
    setPartial({ materials: [], error: null });
  }, [setPartial]);

  const reload = useCallback(() => {
    void load(filters);
  }, [load, filters]);

  const create = useCallback(
    async (payload: UmmCreatePayload) => {
      setPartial({ isSubmitting: true, actionError: null });
      try {
        await ummApi.create(payload);
        await load(filters);
        setPartial({ isSubmitting: false });
      } catch {
        setPartial({
          actionError: 'Не удалось создать материал',
          isSubmitting: false,
        });
        throw new Error('create-failed');
      }
    },
    [setPartial, load, filters]
  );

  const update = useCallback(
    async (id: number, payload: UmmUpdatePayload) => {
      setPartial({ isSubmitting: true, actionError: null });
      try {
        await ummApi.update(id, payload);
        await load(filters);
        setPartial({ isSubmitting: false });
      } catch {
        setPartial({
          actionError: 'Не удалось обновить материал',
          isSubmitting: false,
        });
        throw new Error('update-failed');
      }
    },
    [setPartial, load, filters]
  );

  const remove = useCallback(
    async (id: number) => {
      setPartial({ actionError: null });
      try {
        await ummApi.delete(id);
        await load(filters);
      } catch {
        setPartial({ actionError: 'Не удалось удалить материал' });
      }
    },
    [setPartial, load, filters]
  );

  useEffect(() => {
    void loadMeta();
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    };
  }, [loadMeta]);

  return {
    ...state,
    filters,
    updateFilters,
    resetFilters,
    reload,
    create,
    update,
    remove,
  };
};
