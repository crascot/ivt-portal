import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Card, Modal, Spinner } from 'react-bootstrap';

import { taskApi } from '@api/taskApi';
import { TaskDto, TaskAttachmentDto } from '@entities/taskRequest';
import s from '../Tasks.module.css';

const IMAGE_NAME_PATTERN = /\.(apng|avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i;

type Props = {
  task: TaskDto;
  canEdit: boolean;
  onEdit?: (task: TaskDto) => void;
  onDelete?: (taskId: number) => void;
  onDownloadAttachment: (attachmentId: number, fileName: string) => void;
  onDeleteAttachment?: (attachmentId: number) => void;
};

export const TaskCard = ({
  task,
  canEdit,
  onEdit,
  onDelete,
  onDownloadAttachment,
  onDeleteAttachment,
}: Props) => {
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const [loadingPreviewIds, setLoadingPreviewIds] = useState<number[]>([]);
  const [openedImage, setOpenedImage] = useState<{
    fileName: string;
    url: string;
  } | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const isImageAttachment = (attachment: TaskAttachmentDto) =>
    attachment.contentType?.startsWith('image/') ||
    IMAGE_NAME_PATTERN.test(attachment.fileName);

  const imageAttachments = useMemo(
    () => task.attachments.filter(isImageAttachment),
    [task.attachments]
  );
  const fileAttachments = useMemo(
    () =>
      task.attachments.filter((attachment) => !isImageAttachment(attachment)),
    [task.attachments]
  );

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPreview = async (attachment: TaskAttachmentDto) => {
      if (previewUrls[attachment.id]) return;

      setLoadingPreviewIds((prev) =>
        prev.includes(attachment.id) ? prev : [...prev, attachment.id]
      );

      try {
        const blob = await taskApi.getAttachmentBlob(attachment.id);
        const url = URL.createObjectURL(blob);

        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }

        objectUrlsRef.current.push(url);
        setPreviewUrls((prev) => ({ ...prev, [attachment.id]: url }));
      } finally {
        if (!cancelled) {
          setLoadingPreviewIds((prev) =>
            prev.filter((itemId) => itemId !== attachment.id)
          );
        }
      }
    };

    imageAttachments.forEach((attachment) => {
      void loadPreview(attachment);
    });

    return () => {
      cancelled = true;
    };
  }, [imageAttachments, previewUrls]);

  const handleDelete = () => {
    if (window.confirm(`Удалить задание "${task.title}"?`)) {
      onDelete?.(task.id);
    }
  };

  return (
    <Card className={s.taskCard}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <Card.Title className="mb-1">{task.title}</Card.Title>
            <div className="text-muted small mb-2">
              <span>{task.disciplineName}</span>
              <span className="mx-1">·</span>
              <span>{task.teacherName}</span>
            </div>
          </div>

          {canEdit && (
            <div className="d-flex gap-2 flex-shrink-0 ms-3">
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => onEdit?.(task)}
              >
                Редактировать
              </Button>
              <Button size="sm" variant="outline-danger" onClick={handleDelete}>
                Удалить
              </Button>
            </div>
          )}
        </div>

        {task.description && (
          <Card.Text className="mb-2" style={{ whiteSpace: 'pre-wrap' }}>
            {task.description}
          </Card.Text>
        )}

        {task.attachments.length > 0 && (
          <div>
            <small className="text-muted d-block mb-1">Файлы:</small>
            {imageAttachments.length > 0 && (
              <div className={s.imageGrid}>
                {imageAttachments.map((attachment) => {
                  const previewUrl = previewUrls[attachment.id];
                  const isLoadingPreview = loadingPreviewIds.includes(
                    attachment.id
                  );

                  return (
                    <div key={attachment.id} className={s.imageItem}>
                      <button
                        type="button"
                        className={s.imageThumbButton}
                        disabled={!previewUrl}
                        onClick={() =>
                          previewUrl &&
                          setOpenedImage({
                            fileName: attachment.fileName,
                            url: previewUrl,
                          })
                        }
                      >
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={attachment.fileName}
                            className={s.imageThumb}
                          />
                        ) : (
                          <div className={s.imageThumbPlaceholder}>
                            {isLoadingPreview ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <span>Нет превью</span>
                            )}
                          </div>
                        )}
                      </button>

                      <div className="d-flex align-items-center gap-2 mt-1">
                        <Badge
                          bg="light"
                          text="dark"
                          className={s.attachmentItem}
                          role="button"
                          onClick={() =>
                            onDownloadAttachment(
                              attachment.id,
                              attachment.fileName
                            )
                          }
                        >
                          {attachment.fileName}
                        </Badge>
                        {canEdit && onDeleteAttachment && (
                          <Button
                            size="sm"
                            variant="link"
                            className="p-0 text-danger"
                            title="Удалить файл"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Удалить файл "${attachment.fileName}"?`
                                )
                              ) {
                                onDeleteAttachment(attachment.id);
                              }
                            }}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {fileAttachments.length > 0 && (
              <div className={s.attachmentList}>
                {fileAttachments.map((attachment) => (
                  <span
                    key={attachment.id}
                    className="d-inline-flex align-items-center gap-1"
                  >
                    <Badge
                      bg="light"
                      text="dark"
                      className={s.attachmentItem}
                      role="button"
                      onClick={() =>
                        onDownloadAttachment(attachment.id, attachment.fileName)
                      }
                    >
                      {attachment.fileName}
                    </Badge>
                    {canEdit && onDeleteAttachment && (
                      <Button
                        size="sm"
                        variant="link"
                        className="p-0 text-danger"
                        title="Удалить файл"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Удалить файл "${attachment.fileName}"?`
                            )
                          ) {
                            onDeleteAttachment(attachment.id);
                          }
                        }}
                      >
                        ×
                      </Button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Card.Body>

      <Modal
        show={Boolean(openedImage)}
        onHide={() => setOpenedImage(null)}
        centered
        size="xl"
        dialogClassName={s.previewModalDialog}
        contentClassName={s.previewModalContent}
      >
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title className="text-white small">
            {openedImage?.fileName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={s.previewModalBody}>
          {openedImage && (
            <img
              src={openedImage.url}
              alt={openedImage.fileName}
              className={s.previewFullImage}
            />
          )}
        </Modal.Body>
      </Modal>
    </Card>
  );
};
