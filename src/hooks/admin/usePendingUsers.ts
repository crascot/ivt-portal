import { useCallback, useEffect, useState } from 'react';
import { AdminRequest } from '@entities/adminRequest';
import { adminApi } from '@api/admin/adminApi';

export function usePendingUsers() {
  const [users, setUsers] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getPending();
      setUsers(data);
    } catch (e) {
      setError('Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  }, []);

  const approveUser = useCallback(async (id: number) => {
    await adminApi.approve(id);

    setUsers((prev) => prev.filter((user) => user.id !== id));
  }, []);

  const rejectUser = useCallback(async (id: number) => {
    await adminApi.reject(id);
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
