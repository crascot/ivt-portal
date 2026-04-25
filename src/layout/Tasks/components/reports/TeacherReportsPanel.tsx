import { useMemo, useState } from 'react';
import { Alert, Button, Collapse, Form, Spinner } from 'react-bootstrap';

import { useTeacherReports } from '@hooks/reports/useTeacherReports';
import { ReportDto, ReportStatus } from '@entities/teacherRequest';

import { ReportAttachmentsList } from './ReportAttachmentsList';
import { ReportStatusBadge } from './ReportStatusBadge';
import { TeacherReviewForm } from './TeacherReviewForm';

import s from '../../Tasks.module.css';

type Props = {
  taskId: number;
  teacherId: number;
};

const formatDate = (iso: string) => {
  try {
    const date = new Date(iso);
    return date.toLocaleString('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
};

type StudentReportsGroup = {
  studentId: number;
  studentName: string;
  reports: ReportDto[];
};

export const TeacherReportsPanel = ({ taskId, teacherId }: Props) => {
  const [expandedStudentId, setExpandedStudentId] = useState<number | null>(
    null
  );
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReportStatus>('ALL');
  const [studentQuery, setStudentQuery] = useState('');
  const {
    reports,
    isLoading,
    isSubmitting,
    error,
    setGrade,
    markChecked,
    deleteAttachment,
    downloadAttachment,
    getAttachmentBlob,
    reload,
  } = useTeacherReports(taskId, teacherId);

  const groupedReports = useMemo<StudentReportsGroup[]>(() => {
    const normalizedQuery = studentQuery.trim().toLowerCase();

    const filtered = reports.filter((report) => {
      if (statusFilter !== 'ALL' && report.status !== statusFilter) {
        return false;
      }
      if (
        normalizedQuery.length > 0 &&
        !report.studentName.toLowerCase().includes(normalizedQuery)
      ) {
        return false;
      }
      return true;
    });

    const groups = new Map<number, StudentReportsGroup>();
    filtered.forEach((report) => {
      const existing = groups.get(report.studentId);
      if (existing) {
        existing.reports.push(report);
        return;
      }

      groups.set(report.studentId, {
        studentId: report.studentId,
        studentName: report.studentName,
        reports: [report],
      });
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        reports: [...group.reports].sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime()
        ),
      }))
      .sort((a, b) =>
        a.studentName.localeCompare(b.studentName, 'ru-RU', {
          sensitivity: 'base',
        })
      );
  }, [reports, statusFilter, studentQuery]);

  const filteredReportsCount = useMemo(
    () => groupedReports.reduce((acc, group) => acc + group.reports.length, 0),
    [groupedReports]
  );

  return (
    <div className={s.reportPanel}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">
          Ответы студентов
          {reports.length > 0 && (
            <span className="text-muted ms-2 small">({reports.length})</span>
          )}
        </h6>
        <div className="d-flex align-items-center gap-2">
          {isLoading && <Spinner animation="border" size="sm" />}
          <Button size="sm" variant="outline-secondary" onClick={reload}>
            Обновить
          </Button>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
        <Form.Group controlId={`teacher-reports-status-filter-${taskId}`}>
          <Form.Label className="small text-muted mb-1">Статус</Form.Label>
          <Form.Select
            size="sm"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as 'ALL' | ReportStatus)
            }
          >
            <option value="ALL">Все</option>
            <option value={ReportStatus.Submitted}>Отправлен</option>
            <option value={ReportStatus.Checked}>Проверен</option>
            <option value={ReportStatus.Accepted}>Принят</option>
          </Form.Select>
        </Form.Group>

        <Form.Group
          className="flex-grow-1"
          controlId={`teacher-reports-student-filter-${taskId}`}
        >
          <Form.Label className="small text-muted mb-1">Студент</Form.Label>
          <Form.Control
            size="sm"
            placeholder="Поиск по имени"
            value={studentQuery}
            onChange={(event) => setStudentQuery(event.target.value)}
          />
        </Form.Group>
      </div>

      {error && (
        <Alert variant="danger" className="py-1 px-2 small mb-2">
          {error}
        </Alert>
      )}

      {!isLoading && reports.length === 0 && (
        <Alert variant="light" className="py-2 mb-0 small">
          Студенты еще не отправили ответы
        </Alert>
      )}

      {!isLoading && reports.length > 0 && (
        <div className="small text-muted mb-2">
          Студентов: {groupedReports.length} · попыток: {filteredReportsCount}
        </div>
      )}

      {!isLoading && reports.length > 0 && groupedReports.length === 0 && (
        <Alert variant="light" className="py-2 mb-0 small">
          Нет ответов, подходящих под фильтры
        </Alert>
      )}

      {groupedReports.length > 0 && (
        <div className={s.reportList}>
          {groupedReports.map((group) => {
            const isStudentExpanded = expandedStudentId === group.studentId;

            return (
              <div key={group.studentId} className={s.reportItem}>
                <button
                  type="button"
                  className={s.reportHeaderButton}
                  onClick={() => {
                    setExpandedStudentId(
                      isStudentExpanded ? null : group.studentId
                    );
                    if (isStudentExpanded) {
                      setExpandedReportId(null);
                    }
                  }}
                >
                  <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap w-100">
                    <div className="d-flex flex-column text-start">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <strong>{group.studentName}</strong>
                        <span className="small text-muted">
                          Попыток: {group.reports.length}
                        </span>
                      </div>
                      <small className="text-muted">
                        Последняя отправка{' '}
                        {formatDate(group.reports[0].submittedAt)}
                      </small>
                    </div>
                    <span className="small text-primary">
                      {isStudentExpanded ? 'Свернуть' : 'Открыть'}
                    </span>
                  </div>
                </button>

                <Collapse in={isStudentExpanded}>
                  <div>
                    <div className="d-flex flex-column gap-2 mt-2">
                      {group.reports.map((report, idx) => {
                        const isReportExpanded = expandedReportId === report.id;

                        return (
                          <div key={report.id} className={s.reportNestedItem}>
                            <button
                              type="button"
                              className={s.reportHeaderButton}
                              onClick={() =>
                                setExpandedReportId(
                                  isReportExpanded ? null : report.id
                                )
                              }
                            >
                              <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap w-100">
                                <div className="d-flex flex-column text-start">
                                  <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <span className="small fw-semibold">
                                      Попытка #{idx + 1}
                                    </span>
                                    <ReportStatusBadge status={report.status} />
                                    {report.grade != null && (
                                      <span className="small fw-semibold text-success">
                                        Оценка: {report.grade}
                                      </span>
                                    )}
                                  </div>
                                  <small className="text-muted">
                                    Отправлено {formatDate(report.submittedAt)}
                                    {report.submittedByUserName
                                      ? ` · проверял(а): ${report.submittedByUserName}`
                                      : ''}
                                  </small>
                                </div>
                                <span className="small text-primary">
                                  {isReportExpanded ? 'Свернуть' : 'Открыть'}
                                </span>
                              </div>
                            </button>

                            <Collapse in={isReportExpanded}>
                              <div>
                                {report.comment && (
                                  <p
                                    className="mb-1 mt-2 small"
                                    style={{ whiteSpace: 'pre-wrap' }}
                                  >
                                    {report.comment}
                                  </p>
                                )}

                                <ReportAttachmentsList
                                  attachments={report.attachments}
                                  onDownload={downloadAttachment}
                                  onGetPreviewBlob={getAttachmentBlob}
                                  onDelete={deleteAttachment}
                                />

                                {report.commentTeacher && (
                                  <div className={s.teacherComment}>
                                    <small className="text-muted d-block">
                                      Замечания преподавателя
                                    </small>
                                    <p
                                      className="mb-0 small"
                                      style={{ whiteSpace: 'pre-wrap' }}
                                    >
                                      {report.commentTeacher}
                                    </p>
                                  </div>
                                )}

                                <div className={s.reviewForm}>
                                  <TeacherReviewForm
                                    isSubmitting={isSubmitting}
                                    onCheck={(comment, files) =>
                                      markChecked(report.id, comment, files)
                                    }
                                    onGrade={(grade) =>
                                      setGrade(report.id, grade)
                                    }
                                  />
                                </div>
                              </div>
                            </Collapse>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Collapse>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
