import { useState } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';

import { useTeacherReports } from '@hooks/reports/useTeacherReports';

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

export const TeacherReportsPanel = ({ taskId, teacherId }: Props) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const {
    reports,
    isLoading,
    isSubmitting,
    error,
    setGrade,
    markChecked,
    deleteAttachment,
    downloadAttachment,
    reload,
  } = useTeacherReports(taskId, teacherId);

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

      {reports.length > 0 && (
        <div className={s.reportList}>
          {reports.map((report) => {
            const isExpanded = expandedId === report.id;
            return (
              <div key={report.id} className={s.reportItem}>
                <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                  <div className="d-flex flex-column">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <strong>{report.studentName}</strong>
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
                  <Button
                    size="sm"
                    variant={isExpanded ? 'secondary' : 'outline-primary'}
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  >
                    {isExpanded ? 'Свернуть' : 'Проверить'}
                  </Button>
                </div>

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

                {isExpanded && (
                  <div className={s.reviewForm}>
                    <TeacherReviewForm
                      isSubmitting={isSubmitting}
                      onCheck={(comment, files) =>
                        markChecked(report.id, comment, files)
                      }
                      onGrade={(grade) => setGrade(report.id, grade)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
