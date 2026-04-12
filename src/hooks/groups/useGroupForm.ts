import { adminGroupApi } from '@api/admin/adminGroupApi';
import {
  CreateGroupDto,
  Group,
  GroupFormValues,
  UpdateGroupDto,
} from '@entities/adminRequest';
import { useCrudForm } from '@hooks/useCrudForm';

export const useGroupForm = () => {
  return useCrudForm<Group, GroupFormValues, CreateGroupDto, UpdateGroupDto>({
    api: adminGroupApi,

    getInitialValues: () => ({
      name: '',
      courseNumber: 1,
      specialty: '',
    }),

    mapItemToFormValues: (item) => ({
      name: item.name,
      courseNumber: item.courseNumber,
      specialty: item.specialty,
    }),

    mapFormToCreateDto: (values) => ({
      name: values.name.trim(),
      courseNumber: values.courseNumber,
      specialty: values.specialty.trim(),
    }),

    mapFormToUpdateDto: (values) => ({
      name: values.name.trim(),
      courseNumber: values.courseNumber,
      specialty: values.specialty.trim(),
    }),
  });
};
