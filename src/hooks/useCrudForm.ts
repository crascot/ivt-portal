import { useCallback, useEffect, useState } from 'react';

type CrudApi<TEntity, TCreateDto, TUpdateDto> = {
  getAll: () => Promise<TEntity[]>;
  create: (dto: TCreateDto) => Promise<unknown>;
  update: (id: number, dto: TUpdateDto) => Promise<unknown>;
  remove: (id: number) => Promise<void>;
};

type UseCrudFormOptions<
  TEntity extends { id: number },
  TFormValues,
  TCreateDto,
  TUpdateDto,
> = {
  api: CrudApi<TEntity, TCreateDto, TUpdateDto>;
  getInitialValues: () => TFormValues;
  mapItemToFormValues: (item: TEntity) => TFormValues;
  mapFormToCreateDto: (values: TFormValues) => TCreateDto;
  mapFormToUpdateDto: (values: TFormValues, item: TEntity) => TUpdateDto;
  autoLoad?: boolean;
};

export const useCrudForm = <
  TEntity extends { id: number },
  TFormValues,
  TCreateDto,
  TUpdateDto,
>({
  api,
  getInitialValues,
  mapItemToFormValues,
  mapFormToCreateDto,
  mapFormToUpdateDto,
  autoLoad = true,
}: UseCrudFormOptions<TEntity, TFormValues, TCreateDto, TUpdateDto>) => {
  const [items, setItems] = useState<TEntity[]>([]);
  const [formValues, setFormValues] = useState<TFormValues>(() =>
    getInitialValues()
  );
  const [editingItem, setEditingItem] = useState<TEntity | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setEditingItem(null);
    setFormValues(getInitialValues());
    setActionError(null);
  }, [getInitialValues]);

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const data = await api.getAll();
      setItems(data);
    } catch (error) {
      setLoadError('Не удалось загрузить данные');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    void loadItems();
  }, [autoLoad, loadItems]);

  const startCreate = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const startEdit = useCallback(
    (item: TEntity) => {
      setEditingItem(item);
      setFormValues(mapItemToFormValues(item));
      setActionError(null);
    },
    [mapItemToFormValues]
  );

  const setFieldValue = useCallback(
    <K extends keyof TFormValues>(field: K, value: TFormValues[K]) => {
      setFormValues((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const submit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      setActionError(null);

      if (editingItem) {
        const dto = mapFormToUpdateDto(formValues, editingItem);
        await api.update(editingItem.id, dto);
      } else {
        const dto = mapFormToCreateDto(formValues);
        await api.create(dto);
      }

      await loadItems();
      resetForm();
    } catch (error) {
      setActionError('Не удалось сохранить данные');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    api,
    editingItem,
    formValues,
    loadItems,
    mapFormToCreateDto,
    mapFormToUpdateDto,
    resetForm,
  ]);

  const removeItem = useCallback(
    async (id: number) => {
      try {
        setIsDeleting(true);
        setActionError(null);

        await api.remove(id);
        await loadItems();

        if (editingItem?.id === id) {
          resetForm();
        }
      } catch (error) {
        setActionError('Не удалось удалить данные');
        throw error;
      } finally {
        setIsDeleting(false);
      }
    },
    [api, editingItem?.id, loadItems, resetForm]
  );

  return {
    items,
    formValues,
    editingItem,

    isEditMode: Boolean(editingItem),
    isLoading,
    isSubmitting,
    isDeleting,

    loadError,
    actionError,

    setFormValues,
    setFieldValue,

    loadItems,
    startCreate,
    startEdit,
    submit,
    removeItem,
    resetForm,
  };
};
