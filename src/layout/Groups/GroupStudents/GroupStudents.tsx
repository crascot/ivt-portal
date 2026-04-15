import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Spinner, Table } from 'react-bootstrap';
import { FiStar, FiX } from 'react-icons/fi';

import { adminGroupApi } from '@api/admin/adminGroupApi';
import { GroupStudentsResponse } from '@entities/adminRequest';

type Props = {
  groupId: number;
  groupName: string;
  onClose: () => void;
};

export const GroupStudents = ({ groupId, groupName, onClose }: Props) => {
  const [data, setData] = useState<GroupStudentsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminGroupApi.getGroupStudents(groupId);
      setData(result);
    } catch {
      setError('Не удалось загрузить студентов');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSetStarosta = async (studentId: number) => {
    setActionLoading(studentId);
    try {
      await adminGroupApi.setStarosta(groupId, studentId);
      await load();
    } catch {
      setError('Не удалось назначить старосту');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveStarosta = async () => {
    setActionLoading(-1);
    try {
      await adminGroupApi.removeStarosta(groupId);
      await load();
    } catch {
      setError('Не удалось снять старосту');
    } finally {
      setActionLoading(null);
    }
  };

  const starostaId = data?.group.starostaId ?? null;
  const starostaName = data?.group.starostaName ?? null;
  const students = data?.students ?? [];

  return (
    <Card border="primary">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <strong>Студенты группы {groupName}</strong>
          {starostaName && (
            <Badge bg="warning" text="dark" className="ms-2">
              Староста: {starostaName}
            </Badge>
          )}
        </div>
        <Button variant="outline-secondary" size="sm" onClick={onClose}>
          <FiX size={16} />
        </Button>
      </Card.Header>

      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        {isLoading ? (
          <div className="d-flex align-items-center gap-2">
            <Spinner animation="border" size="sm" />
            <span>Загрузка студентов...</span>
          </div>
        ) : students.length === 0 ? (
          <Alert variant="light" className="mb-0">
            В этой группе пока нет студентов
          </Alert>
        ) : (
          <Table responsive bordered hover className="align-middle mb-0">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>#</th>
                <th>ФИО</th>
                <th>Email</th>
                <th style={{ width: '60px' }}>Роль</th>
                <th style={{ width: '220px' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => {
                const isStarosta = student.id === starostaId;

                return (
                  <tr
                    key={student.id}
                    className={isStarosta ? 'table-warning' : ''}
                  >
                    <td>{index + 1}</td>
                    <td>
                      {student.user.fullName}
                      {isStarosta && (
                        <FiStar
                          size={14}
                          className="ms-1 text-warning"
                          style={{ verticalAlign: 'text-top' }}
                        />
                      )}
                    </td>
                    <td>{student.user.email}</td>
                    <td className="text-center">
                      {isStarosta ? (
                        <Badge bg="warning" text="dark">
                          Староста
                        </Badge>
                      ) : (
                        <Badge bg="secondary">Студент</Badge>
                      )}
                    </td>
                    <td>
                      {isStarosta ? (
                        <Button
                          size="sm"
                          variant="outline-danger"
                          disabled={actionLoading !== null}
                          onClick={handleRemoveStarosta}
                        >
                          {actionLoading === -1 ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            'Снять старосту'
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline-success"
                          disabled={actionLoading !== null}
                          onClick={() => handleSetStarosta(student.id)}
                        >
                          {actionLoading === student.id ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            'Назначить старостой'
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
};
