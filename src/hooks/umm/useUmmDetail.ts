import { useCallback, useEffect, useState } from 'react';

import { ummApi } from '@api/ummApi';
import {
  UmmMaterialDto,
  UmmUpdatePayload,
} from '@entities/ummRequest';

type State = {
  material: UmmMaterialDto | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  actionError: string | null;
};

const initialState: State = {
  material: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  actionError: null,
};

export const useUmmDetail = (id: number | null) => {
  const [state, setState] = useState<State>(initialState);

  const setPartial = useCallback(
    (patch: Partial<State>) => setState((prev) => ({ ...prev, ...patch })),
    []
  );

  const load = useCallback(async () => {
    if (id == null) return;
    setPartial({ isLoading: true, error: null });
    try {
      const material = await ummApi.getById(id);
      setPartial({ material, isLoading: false });
    } catch {
      setPartial({
        error: 'Не удалось загрузить материал',
        isLoading: false,
      });
    }
  }, [id, setPartial]);

  const update = useCallback(
    async (payload: UmmUpdatePayload) => {
      if (id == null) return;
      setPartial({ isSubmitting: true, actionError: null });
      try {
        const material = await ummApi.update(id, payload);
        setPartial({ material, isSubmitting: false });
      } catch {
        setPartial({
          actionError: 'Не удалось обновить материал',
          isSubmitting: false,
        });
        throw new Error('update-failed');
      }
    },
    [id, setPartial]
  );

  const removeUrl = useCallback(
    async (url: string) => {
      if (id == null) return;
      setPartial({ actionError: null });
      try {
        await ummApi.removeUrl(id, url);
        await load();
      } catch {
        setPartial({ actionError: 'Не удалось удалить ссылку' });
      }
    },
    [id, setPartial, load]
  );

  const deleteAttachment = useCallback(
    async (attachmentId: number) => {
      setPartial({ actionError: null });
      try {
        await ummApi.deleteAttachment(attachmentId);
        await load();
      } catch {
        setPartial({ actionError: 'Не удалось удалить файл' });
      }
    },
    [setPartial, load]
  );

  const downloadAttachment = useCallback(
    async (attachmentId: number, fileName: string) => {
      try {
        await ummApi.downloadAttachment(attachmentId, fileName);
      } catch {
        setPartial({ actionError: 'Не удалось скачать файл' });
      }
    },
    [setPartial]
  );

  const remove = useCallback(async () => {
    if (id == null) return;
    setPartial({ isSubmitting: true, actionError: null });
    try {
      await ummApi.delete(id);
      setPartial({ isSubmitting: false });
    } catch {
      setPartial({
        actionError: 'Не удалось удалить материал',
        isSubmitting: false,
      });
      throw new Error('delete-failed');
    }
  }, [id, setPartial]);

  useEffect(() => {
    if (id != null) {
      void load();
    }
  }, [id, load]);

  return {
    ...state,
    reload: load,
    update,
    remove,
    removeUrl,
    deleteAttachment,
    downloadAttachment,
  };
};
