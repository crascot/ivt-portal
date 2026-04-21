import { useCallback, useEffect, useState } from 'react';
import { adminAuthApi } from '@api/admin/adminAuthApi';
import { RoleEnum } from '@entities/role-enum';

type PendingUsersType = {
  id: number;
  fullName: string;
  email: string;
  roles: { id: number; name: RoleEnum }[];
  status: string;
};

export function usePendingUsers() {
  const [users, setUsers] = useState<PendingUsersType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAuthApi.getPending();
      setUsers(data);
    } catch (e) {
      setError('Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  }, []);

  const approveUser = useCallback(async (id: number) => {
    await adminAuthApi.approve(id);

    setUsers((prev) => prev.filter((user) => user.id !== id));
  }, []);

  const rejectUser = useCallback(async (id: number) => {
    await adminAuthApi.reject(id);
    setUsers((prev) => prev.filter((user) => user.id !== id));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    approveUser,
    rejectUser,
  };
}
