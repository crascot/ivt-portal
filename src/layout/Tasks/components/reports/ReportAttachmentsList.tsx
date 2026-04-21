import { Badge, Button } from 'react-bootstrap';

import { ReportAttachmentDto } from '@entities/teacherRequest';
import s from '../../Tasks.module.css';

type Props = {
  attachments: ReportAttachmentDto[];
  onDownload: (attachmentId: number, fileName: string) => void;
  onDelete?: (attachmentId: number) => void;
};

export const ReportAttachmentsList = ({
  attachments,
  onDownload,
  onDelete,
}: Props) => {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className={s.attachmentList}>
      {attachments.map((attachment) => (
        <span
          key={attachment.id}
          className="d-inline-flex align-items-center gap-1"
        >
          <Badge
            bg="light"
            text="dark"
            className={s.attachmentItem}
            role="button"
            onClick={() => onDownload(attachment.id, attachment.fileName)}
          >
            {attachment.fileName}
          </Badge>
          {onDelete && (
            <Button
              size="sm"
              variant="link"
              className="p-0 text-danger"
              title="Удалить файл"
              onClick={() => {
                if (window.confirm(`Удалить файл "${attachment.fileName}"?`)) {
                  onDelete(attachment.id);
                }
              }}
            >
              ×
            </Button>
          )}
        </span>
      ))}
    </div>
  );
};
