import { Alert, Button, Spinner } from 'react-bootstrap';

import { useStudentReports } from '@hooks/reports/useStudentReports';
import { ReportDto, ReportStatus } from '@entities/teacherRequest';

import { ReportAttachmentsList } from './ReportAttachmentsList';
import { ReportStatusBadge } from './ReportStatusBadge';
import { ReportSubmitForm } from './ReportSubmitForm';

import s from '../../Tasks.module.css';

type Props = {
  taskId: number;
  studentId: number;
  onMutated?: () => void;
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

const canEditReport = (report: ReportDto) =>
  report.status === ReportStatus.Submitted;

export const StudentReportsPanel = ({
  taskId,
  studentId,
  onMutated,
}: Props) => {
  const {
    reports,
    isLoading,
    isSubmitting,
    error,
    submitReport,
    deleteReport,
    deleteAttachment,
    downloadAttachment,
  } = useStudentReports(taskId, studentId);

  const runAndNotify = async (action: () => Promise<void>) => {
    await action();
    onMutated?.();
  };

  return (
    <div className={s.reportPanel}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">Мои ответы</h6>
        {isLoading && <Spinner animation="border" size="sm" />}
      </div>

      {error && (
        <Alert variant="danger" className="py-1 px-2 small mb-2">
          {error}
        </Alert>
      )}

      <div className="mb-3">
        <ReportSubmitForm
          isSubmitting={isSubmitting}
          error={null}
          onSubmit={(comment, files) =>
            runAndNotify(() => submitReport(comment, files))
          }
        />
      </div>

      {!isLoading && reports.length === 0 && (
        <Alert variant="light" className="py-2 mb-0 small">
          Вы еще не отправляли ответы на это задание
        </Alert>
      )}

      {reports.length > 0 && (
        <div className={s.reportList}>
          {reports.map((report) => (
            <div key={report.id} className={s.reportItem}>
              <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <ReportStatusBadge status={report.status} />
                  <small className="text-muted">
                    Отправлено {formatDate(report.submittedAt)}
                  </small>
                  {report.grade != null && (
                    <span className="small fw-semibold text-success">
                      Оценка: {report.grade}
                    </span>
                  )}
                </div>
                {canEditReport(report) && (
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => {
                      if (window.confirm('Удалить этот ответ?')) {
                        void runAndNotify(() => deleteReport(report.id));
                      }
                    }}
                  >
                    Удалить
                  </Button>
                )}
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
                onDelete={
                  canEditReport(report)
                    ? (id) => void runAndNotify(() => deleteAttachment(id))
                    : undefined
                }
              />

              {report.commentTeacher && (
                <div className={s.teacherComment}>
                  <small className="text-muted d-block">
                    Замечания преподавателя
                    {report.submittedByUserName
                      ? ` · ${report.submittedByUserName}`
                      : ''}
                  </small>
                  <p className="mb-0 small" style={{ whiteSpace: 'pre-wrap' }}>
                    {report.commentTeacher}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
