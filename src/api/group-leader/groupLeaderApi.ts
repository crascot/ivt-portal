// import api from '@utils/api';

// export const groupLeaderApi = {
//   getAll: async (): Promise<Group[]> => {
//     const response = await api.get<Group[]>('/leader/schedule');
//     return response.data;
//   },

//   create: async (dto: CreateGroupDto): Promise<Group> => {
//     const response = await api.post<Group>('/leader/schedule', dto);
//     return response.data;
//   },

//   update: async (id: number, dto: UpdateGroupDto): Promise<Group> => {
//     const response = await api.put<Group>(`/leader/group/${id}`, dto);
//     return response.data;
//   },

//   remove: async (id: number): Promise<void> => {
//     await api.delete(`/leader/schedule/${id}`);
//   },
// };
