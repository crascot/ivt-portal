import { adminGroupApi } from '@api/admin/adminGroupApi';
import { Group } from '@entities/adminRequest';
import { useMount } from '@utils/use-mount';
import { useState } from 'react';

export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminGroupApi.getAll();
      setGroups(data);
    } catch (e) {
      setError('Не удалось загрузить группы');
    } finally {
      setIsLoading(false);
    }
  };

  useMount(() => {
    fetchGroups();
  });

  return {
    groups,
    isLoading,
    error,
    refetchGroups: fetchGroups,
    setGroups,
  };
};
