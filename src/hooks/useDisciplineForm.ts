import { adminDisciplineApi } from '@api/admin/adminDiscipline';
import {
  CreateDisciplineDto,
  Discipline,
  DisciplineFormValues,
  UpdateDisciplineDto,
} from '@entities/adminRequest';

import { useCrudForm } from '@hooks/useCrudForm';

export const useDisciplineForm = () => {
  return useCrudForm<
    Discipline,
    DisciplineFormValues,
    CreateDisciplineDto,
    UpdateDisciplineDto
  >({
    api: adminDisciplineApi,

    getInitialValues: () => ({
      name: '',
      description: '',
    }),

    mapItemToFormValues: (item) => ({
      name: item.name,
      description: item.description,
    }),

    mapFormToCreateDto: (values) => ({
      name: values.name.trim(),
      description: values.description.trim(),
    }),

    mapFormToUpdateDto: (values) => ({
      name: values.name.trim(),
      description: values.description.trim(),
    }),
  });
};
