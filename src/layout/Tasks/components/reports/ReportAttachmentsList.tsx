import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Modal, Spinner } from 'react-bootstrap';

import { ReportAttachmentDto } from '@entities/teacherRequest';
import s from '../../Tasks.module.css';

type Props = {
  attachments: ReportAttachmentDto[];
  onDownload: (attachmentId: number, fileName: string) => void;
  onDelete?: (attachmentId: number) => void;
  onGetPreviewBlob?: (attachmentId: number) => Promise<Blob>;
};

const IMAGE_NAME_PATTERN = /\.(apng|avif|bmp|gif|ico|jpe?g|png|svg|webp)$/i;

export const ReportAttachmentsList = ({
  attachments,
  onDownload,
  onDelete,
  onGetPreviewBlob,
}: Props) => {
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const [loadingPreviewIds, setLoadingPreviewIds] = useState<number[]>([]);
  const [openedImage, setOpenedImage] = useState<{
    fileName: string;
    url: string;
  } | null>(null);
  const objectUrlsRef = useRef<string[]>([]);

  const isImageAttachment = (attachment: ReportAttachmentDto) =>
    attachment.contentType?.startsWith('image/') ||
    IMAGE_NAME_PATTERN.test(attachment.fileName);

  const imageAttachments = useMemo(
    () => attachments.filter(isImageAttachment),
    [attachments]
  );
  const fileAttachments = useMemo(
    () => attachments.filter((attachment) => !isImageAttachment(attachment)),
    [attachments]
  );

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!onGetPreviewBlob || imageAttachments.length === 0) {
      return;
    }

    let cancelled = false;

    const loadPreview = async (attachment: ReportAttachmentDto) => {
      if (previewUrls[attachment.id]) return;

      setLoadingPreviewIds((prev) =>
        prev.includes(attachment.id) ? prev : [...prev, attachment.id]
      );

      try {
        const blob = await onGetPreviewBlob(attachment.id);
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
  }, [imageAttachments, onGetPreviewBlob, previewUrls]);

  if (attachments.length === 0) {
    return null;
  }

  return (
    <>
      {imageAttachments.length > 0 && (
        <div className={s.imageGrid}>
          {imageAttachments.map((attachment) => {
            const previewUrl = previewUrls[attachment.id];
            const isLoadingPreview = loadingPreviewIds.includes(attachment.id);
            const canOpenPreview = Boolean(previewUrl);

            return (
              <div key={attachment.id} className={s.imageItem}>
                <button
                  type="button"
                  className={s.imageThumbButton}
                  disabled={!canOpenPreview}
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
                      onDownload(attachment.id, attachment.fileName)
                    }
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
                        if (
                          window.confirm(
                            `Удалить файл "${attachment.fileName}"?`
                          )
                        ) {
                          onDelete(attachment.id);
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
                    if (
                      window.confirm(`Удалить файл "${attachment.fileName}"?`)
                    ) {
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
      )}

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
    </>
  );
};
