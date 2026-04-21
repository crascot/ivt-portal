import { Badge } from 'react-bootstrap';

import { REPORT_STATUS_LABELS, ReportStatus } from '@entities/teacherRequest';

const VARIANT_BY_STATUS: Record<ReportStatus, string> = {
  [ReportStatus.Submitted]: 'primary',
  [ReportStatus.Checked]: 'warning',
  [ReportStatus.Accepted]: 'success',
};

type Props = {
  status: ReportStatus;
};

export const ReportStatusBadge = ({ status }: Props) => (
  <Badge bg={VARIANT_BY_STATUS[status]}>{REPORT_STATUS_LABELS[status]}</Badge>
);
