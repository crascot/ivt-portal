import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { generatePath, useNavigate, useParams } from 'react-router-dom';
import {
  FaBookOpen,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaRedo,
  FaTasks,
  FaUser,
  FaUsers,
} from 'react-icons/fa';

import { adminGroupApi } from '@api/admin/adminGroupApi';
import { scheduleApi } from '@api/scheduleApi';
import { studentApi } from '@api/studentApi';
import { taskApi } from '@api/taskApi';
import { useAnnouncements } from '@context/AnnouncementContext';
import { useAuth } from '@context/AuthContext';
import { AnnouncementDto, AnnouncementType } from '@entities/announcementRequest';
import { RoleEnum } from '@entities/role-enum';
import { ReportDto, ReportStatus } from '@entities/teacherRequest';
import { StudentShort } from '@entities/adminRequest';
import { ROUTES } from '@utils/routes';
import {
  DisciplineShort,
  GroupShort,
} from '@entities/scheduleRequest';
import {
  TaskAnalyticsDto,
  TaskDto,
  TaskStatisticsDto,
} from '@entities/taskRequest';

import s from './Statistics.module.css';

type StudentState = {
  fullName: string;
  tasks: TaskDto[];
  reports: ReportDto[];
  notifications: AnnouncementDto[];
};

type TeacherState = {
  statistics: TaskStatisticsDto | null;
  analytics: TaskAnalyticsDto | null;
};

type DisciplineAverage = {
  disciplineId: number;
  disciplineName: string;
  averageGrade: number;
  gradedReports: number;
};

type GroupMetric = {
  groupId: number;
  groupName: string;
  studentCount: number;
  averageGrade: number;
  gradedReports: number;
  tasksCount: number;
};

type StudentDetail = {
  fullName: string;
  disciplineName: string;
  averageGrade: number;
  gradedReports: number;
  totalTasks: number;
  accepted: number;
  underReview: number;
  overdue: number;
  untouched: number;
  completion: number;
};

type StudentReportsEntry = {
  studentId: number;
  studentName: string;
  groupName: string;
  reports: ReportDto[];
};

type StudentTopMetric = {
  studentId: number;
  studentName: string;
  groupName: string;
  averageGrade: number;
  gradedReports: number;
  submittedReports: number;
  accepted: number;
  underReview: number;
  overdue: number;
  completion: number;
};

type SubmissionOverview = {
  accepted: number;
  pending: number;
  overdue: number;
  untouched: number;
};

type AdminStatisticsParams = {
  disciplineId?: string;
  groupId?: string;
  studentId?: string;
};

const parseRouteId = (value: string | undefined) => {
  if (!value) return null;

  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const isStudentRole = (role: RoleEnum | undefined) =>
  role === RoleEnum.STUDENT || role === RoleEnum.GROUP_LEADER;

const isTeacherRole = (role: RoleEnum | undefined) =>
  role === RoleEnum.TEACHER || role === RoleEnum.ADMIN;

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
  });
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatGrade = (value: number) =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

const getLatestReportsByTask = (reports: ReportDto[]) =>
  reports.reduce<Record<number, ReportDto>>((acc, report) => {
    const current = acc[report.taskId];
    const currentTime = current ? new Date(current.submittedAt).getTime() : 0;
    const reportTime = new Date(report.submittedAt).getTime();

    if (!current || reportTime >= currentTime) {
      acc[report.taskId] = report;
    }

    return acc;
  }, {});

const isStudentTaskOverdue = (task: TaskDto, report?: ReportDto) => {
  if (!task.deadline) return false;

  const deadline = new Date(task.deadline);
  return (
    !Number.isNaN(deadline.getTime()) &&
    deadline.getTime() < Date.now() &&
    report?.status !== ReportStatus.Accepted
  );
};

const getWeekStart = (value: string) => {
  const date = new Date(value);
  const day = date.getDay() || 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day + 1);
  return date;
};

const buildWeeklyActivity = (reports: ReportDto[]) => {
  const firstWeek = getWeekStart(new Date().toISOString());
  firstWeek.setDate(firstWeek.getDate() - 7 * 7);

  const counts = reports.reduce<Record<string, number>>((acc, report) => {
    const key = getWeekStart(report.submittedAt).toISOString().slice(0, 10);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return Array.from({ length: 8 }, (_, index) => {
    const week = new Date(firstWeek);
    week.setDate(firstWeek.getDate() + index * 7);
    const key = week.toISOString().slice(0, 10);

    return {
      key,
      label: formatDate(key),
      count: counts[key] ?? 0,
    };
  });
};

const buildDisciplineAverages = (
  tasks: TaskDto[],
  reports: ReportDto[]
): DisciplineAverage[] => {
  const latestReports = getLatestReportsByTask(reports);
  const aggregate = tasks.reduce<Record<number, {
    disciplineId: number;
    disciplineName: string;
    total: number;
    count: number;
  }>>((acc, task) => {
    if (!task.disciplineId) return acc;
    const report = latestReports[task.id];
    if (report?.grade == null) return acc;

    const disciplineId = task.disciplineId;
    const current = acc[disciplineId] ?? {
      disciplineId,
      disciplineName: task.disciplineName,
      total: 0,
      count: 0,
    };

    current.total += report.grade;
    current.count += 1;
    acc[disciplineId] = current;
    return acc;
  }, {});

  return Object.values(aggregate)
    .map((item) => ({
      disciplineId: item.disciplineId,
      disciplineName: item.disciplineName,
      averageGrade: Number((item.total / item.count).toFixed(1)),
      gradedReports: item.count,
    }))
    .sort((a, b) => b.averageGrade - a.averageGrade);
};

const buildStudentDetail = (
  fullName: string,
  disciplineName: string,
  tasks: TaskDto[],
  reports: ReportDto[]
): StudentDetail => {
  const taskIds = new Set(tasks.map((task) => task.id));
  const disciplineReports = reports.filter((report) => taskIds.has(report.taskId));
  const latestReports = getLatestReportsByTask(disciplineReports);

  const accepted = Object.values(latestReports).filter(
    (report) =>
      report.status === ReportStatus.Accepted ||
      report.status === ReportStatus.Checked
  ).length;
  const underReview = Object.values(latestReports).filter(
    (report) => report.status === ReportStatus.Submitted
  ).length;
  const overdue = tasks.filter((task) =>
    isStudentTaskOverdue(task, latestReports[task.id])
  ).length;
  const totalTasks = tasks.length;

  const gradedReports = disciplineReports.filter((report) => report.grade != null);
  const averageGrade =
    gradedReports.length > 0
      ? Number(
          (
            gradedReports.reduce((sum, report) => sum + (report.grade ?? 0), 0) /
            gradedReports.length
          ).toFixed(1)
        )
      : 0;

  return {
    fullName,
    disciplineName,
    averageGrade,
    gradedReports: gradedReports.length,
    totalTasks,
    accepted,
    underReview,
    overdue,
    untouched: Math.max(totalTasks - accepted - underReview - overdue, 0),
    completion: totalTasks > 0 ? Math.round((accepted / totalTasks) * 100) : 0,
  };
};

const buildGroupMetric = (
  studentReports: ReportDto[][],
  tasks: TaskDto[],
  groupId: number,
  groupName: string
): GroupMetric => {
  const taskIds = new Set(tasks.map((task) => task.id));
  const disciplineReports = studentReports.flatMap((reports) =>
    reports.filter((report) => taskIds.has(report.taskId))
  );

  const gradedReports = disciplineReports.filter((report) => report.grade != null);
  const averageGrade =
    gradedReports.length > 0
      ? Number(
          (
            gradedReports.reduce((sum, report) => sum + (report.grade ?? 0), 0) /
            gradedReports.length
          ).toFixed(1)
        )
      : 0;

  return {
    groupId,
    groupName,
    studentCount: studentReports.length,
    averageGrade,
    gradedReports: gradedReports.length,
    tasksCount: tasks.length,
  };
};

const buildStudentTopMetrics = (
  entries: StudentReportsEntry[],
  tasks: TaskDto[]
): StudentTopMetric[] =>
  entries
    .map((entry) => {
      const detail = buildStudentDetail(
        entry.studentName,
        '',
        tasks,
        entry.reports
      );

      return {
        studentId: entry.studentId,
        studentName: entry.studentName,
        groupName: entry.groupName,
        averageGrade: detail.averageGrade,
        gradedReports: detail.gradedReports,
        submittedReports: entry.reports.filter((report) =>
          tasks.some((task) => task.id === report.taskId)
        ).length,
        accepted: detail.accepted,
        underReview: detail.underReview,
        overdue: detail.overdue,
        completion: detail.completion,
      };
    })
    .filter((item) => item.gradedReports > 0 || item.submittedReports > 0)
    .sort(
      (a, b) =>
        b.averageGrade - a.averageGrade ||
        b.completion - a.completion ||
        b.gradedReports - a.gradedReports
    );

const buildSubmissionOverviewFromEntries = (
  entries: StudentReportsEntry[],
  tasks: TaskDto[]
): SubmissionOverview =>
  entries.reduce<SubmissionOverview>(
    (acc, entry) => {
      const detail = buildStudentDetail(entry.studentName, '', tasks, entry.reports);
      acc.accepted += detail.accepted;
      acc.pending += detail.underReview;
      acc.overdue += detail.overdue;
      acc.untouched += detail.untouched;
      return acc;
    },
    { accepted: 0, pending: 0, overdue: 0, untouched: 0 }
  );

const EmptyState = ({ text }: { text: string }) => (
  <div className={s.emptyState}>{text}</div>
);

const buildStatusGradient = ({
  accepted,
  pending,
  overdue,
  untouched = 0,
}: {
  accepted: number;
  pending: number;
  overdue: number;
  untouched?: number;
}) => {
  const total = accepted + pending + overdue + untouched;
  if (total <= 0) {
    return 'conic-gradient(#adb5bd 0 100%)';
  }

  const acceptedEnd = (accepted / total) * 100;
  const pendingEnd = acceptedEnd + (pending / total) * 100;
  const overdueEnd = pendingEnd + (overdue / total) * 100;

  return `conic-gradient(
    #198754 0 ${acceptedEnd}%,
    #f59f00 ${acceptedEnd}% ${pendingEnd}%,
    #dc3545 ${pendingEnd}% ${overdueEnd}%,
    #adb5bd ${overdueEnd}% 100%
  )`;
};

const MetricCard = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: JSX.Element;
  label: string;
  value: number | string;
  tone: 'blue' | 'green' | 'amber' | 'red';
}) => (
  <article className={s.metricCard}>
    <span className={`${s.metricIcon} ${s[tone]}`}>{icon}</span>
    <small>{label}</small>
    <strong>{value}</strong>
  </article>
);

const LineChart = ({
  items,
  title,
}: {
  items: { key: string; label: string; count: number }[];
  title: string;
}) => {
  const maxValue = Math.max(...items.map((item) => item.count), 1);
  const points = items
    .map((item, index) => {
      const x = items.length > 1 ? (index * 360) / (items.length - 1) : 180;
      const y = 150 - (item.count / maxValue) * 118;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <article className={`${s.panel} ${s.widePanel}`}>
      <div className={s.panelTitle}>
        <FaChartLine />
        <h2>{title}</h2>
      </div>

      <div className={s.lineChart}>
        <svg viewBox="0 0 360 170" role="img" aria-label={title}>
          <polyline className={s.gridLine} points="0,145 360,145" />
          <polyline className={s.gridLine} points="0,90 360,90" />
          <polyline className={s.line} points={points} />
          {items.map((item, index) => {
            const x = items.length > 1 ? (index * 360) / (items.length - 1) : 180;
            const y = 150 - (item.count / maxValue) * 118;

            return (
              <g key={item.key}>
                <circle className={s.linePoint} cx={x} cy={y} r="4" />
                <text className={s.pointLabel} x={x} y={y - 10}>
                  {item.count}
                </text>
              </g>
            );
          })}
        </svg>

        <div className={s.weekLabels}>
          {items.map((item) => (
            <span key={item.key}>{item.label}</span>
          ))}
        </div>
      </div>
    </article>
  );
};

export const Statistics = () => {
  const { user } = useAuth();
  const { getHistory } = useAnnouncements();
  const navigate = useNavigate();
  const {
    disciplineId: routeDisciplineId,
    groupId: routeGroupId,
    studentId: routeStudentId,
  } = useParams<AdminStatisticsParams>();

  const [studentState, setStudentState] = useState<StudentState | null>(null);
  const [teacherState, setTeacherState] = useState<TeacherState>({
    statistics: null,
    analytics: null,
  });
  const [disciplines, setDisciplines] = useState<DisciplineShort[]>([]);
  const [groups, setGroups] = useState<GroupShort[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState<DisciplineShort | null>(null);
  const [disciplineTasks, setDisciplineTasks] = useState<TaskDto[]>([]);
  const [disciplineGroups, setDisciplineGroups] = useState<GroupShort[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string>('');
  const [groupStudents, setGroupStudents] = useState<StudentShort[]>([]);
  const [disciplineStudentReports, setDisciplineStudentReports] = useState<
    StudentReportsEntry[]
  >([]);
  const [groupStudentReports, setGroupStudentReports] = useState<
    StudentReportsEntry[]
  >([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentShort | null>(null);
  const [studentDetails, setStudentDetails] = useState<StudentDetail | null>(null);
  const [selectedStudentReports, setSelectedStudentReports] = useState<ReportDto[]>([]);
  const [groupMetric, setGroupMetric] = useState<GroupMetric | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = user?.role;
  const studentView = isStudentRole(role);
  const adminView = role === RoleEnum.ADMIN;
  const teacherView = isTeacherRole(role);
  const adminDisciplineId = parseRouteId(routeDisciplineId);
  const adminGroupId = parseRouteId(routeGroupId);
  const adminStudentId = parseRouteId(routeStudentId);

  const scrollToAdminSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (studentView) {
        const profile = await scheduleApi.getStudentProfile();
        const disciplines = await studentApi.getDisciplinesByGroup(profile.groupId);
        const [taskLists, reports, notifications] = await Promise.all([
          Promise.all(
            disciplines.map((discipline) =>
              taskApi.getTasksByDiscipline(discipline.id)
            )
          ),
          studentApi.getAllReportsByStudent(profile.studentId),
          getHistory(),
        ]);

        setStudentState({
          fullName: profile.fullName,
          tasks: taskLists.flat(),
          reports,
          notifications,
        });
      }

      if (teacherView) {
        const [statistics, analytics] = await Promise.all([
          taskApi.getTaskStatistics(),
          taskApi.getTaskAnalytics(),
        ]);

        setTeacherState({ statistics, analytics });
      }

      if (adminView) {
        const [disciplinesData, groupsData] = await Promise.all([
          scheduleApi.getDisciplines(),
          scheduleApi.getGroups(),
        ]);

        setDisciplines(disciplinesData);
        setGroups(groupsData);
      }
    } catch {
      setError('Не удалось загрузить статистику.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisciplineChange = async (
    disciplineId: number | null,
    shouldNavigate = true
  ) => {
    setSelectedDiscipline(null);
    setSelectedGroupId(null);
    setSelectedGroupName('');
    setGroupStudents([]);
    setDisciplineStudentReports([]);
    setGroupStudentReports([]);
    setSelectedStudent(null);
    setStudentDetails(null);
    setSelectedStudentReports([]);
    setGroupMetric(null);
    setDisciplineGroups([]);
    setDisciplineTasks([]);

    if (!disciplineId) {
      if (shouldNavigate) {
        navigate(ROUTES.STATISTICS);
      }

      return;
    }

    const discipline = disciplines.find((item) => item.id === disciplineId);
    if (!discipline) {
      return;
    }

    setSelectedDiscipline(discipline);

    if (shouldNavigate) {
      navigate(
        generatePath(ROUTES.ADMIN_STATISTICS_DISCIPLINE, {
          disciplineId: String(discipline.id),
        })
      );
    }

    try {
      setIsLoading(true);
      const [tasks, scheduleGroups] = await Promise.all([
        taskApi.getTasksByDiscipline(discipline.id),
        Promise.all(
          groups.map(async (group) => {
            const schedule = await scheduleApi.getAdminGroupSchedule(group.id);
            return schedule.some((item) => item.disciplineName === discipline.name)
              ? group
              : null;
          })
        ),
      ]);

      const disciplineGroupsData = scheduleGroups.filter(Boolean) as GroupShort[];
      const studentEntries = await Promise.all(
        disciplineGroupsData.map(async (group) => {
          const groupData = await adminGroupApi.getGroupStudents(group.id);
          const reports = await Promise.all(
            groupData.students.map((student) =>
              studentApi.getAllReportsByStudent(student.id)
            )
          );

          return groupData.students.map((student, index) => ({
            studentId: student.id,
            studentName: student.user.fullName,
            groupName: group.name,
            reports: reports[index],
          }));
        })
      );

      setDisciplineTasks(tasks);
      setDisciplineGroups(disciplineGroupsData);
      setDisciplineStudentReports(studentEntries.flat());
    } catch {
      setError('Не удалось загрузить группы для выбранной дисциплины.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupSelect = async (group: GroupShort, shouldNavigate = true) => {
    if (!selectedDiscipline) return;

    setSelectedGroupId(group.id);
    setSelectedGroupName(group.name);
    setSelectedStudent(null);
    setStudentDetails(null);
    setSelectedStudentReports([]);
    setGroupStudentReports([]);
    setGroupMetric(null);

    if (shouldNavigate) {
      navigate(
        generatePath(ROUTES.ADMIN_STATISTICS_GROUP, {
          disciplineId: String(selectedDiscipline.id),
          groupId: String(group.id),
        })
      );
    }

    try {
      setIsLoading(true);
      const groupData = await adminGroupApi.getGroupStudents(group.id);
      setGroupStudents(groupData.students);

      const studentReports = await Promise.all(
        groupData.students.map((student) =>
          studentApi.getAllReportsByStudent(student.id)
        )
      );
      setGroupStudentReports(
        groupData.students.map((student, index) => ({
          studentId: student.id,
          studentName: student.user.fullName,
          groupName: group.name,
          reports: studentReports[index],
        }))
      );

      setGroupMetric(
        buildGroupMetric(studentReports, disciplineTasks, group.id, group.name)
      );
    } catch {
      setError('Не удалось загрузить информацию по группе.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSelect = async (
    student: StudentShort,
    shouldNavigate = true
  ) => {
    if (!selectedDiscipline) return;

    setSelectedStudent(student);
    setStudentDetails(null);
    setSelectedStudentReports([]);

    if (shouldNavigate && selectedGroupId) {
      navigate(
        generatePath(ROUTES.ADMIN_STATISTICS_STUDENT, {
          disciplineId: String(selectedDiscipline.id),
          groupId: String(selectedGroupId),
          studentId: String(student.id),
        })
      );
    }

    try {
      setIsLoading(true);
      const [reports] = await Promise.all([
        studentApi.getAllReportsByStudent(student.id),
      ]);
      setSelectedStudentReports(reports);

      setStudentDetails(
        buildStudentDetail(
          student.user.fullName,
          selectedDiscipline.name,
          disciplineTasks,
          reports
        )
      );
    } catch {
      setError('Не удалось загрузить статистику студента.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    if (!adminView || disciplines.length === 0 || groups.length === 0) {
      return;
    }

    if (!adminDisciplineId) {
      setSelectedDiscipline(null);
      setSelectedGroupId(null);
      setSelectedGroupName('');
      setGroupStudents([]);
      setDisciplineStudentReports([]);
      setGroupStudentReports([]);
      setSelectedStudent(null);
      setStudentDetails(null);
      setSelectedStudentReports([]);
      setGroupMetric(null);
      setDisciplineGroups([]);
      setDisciplineTasks([]);
      return;
    }

    if (selectedDiscipline?.id === adminDisciplineId) {
      return;
    }

    void handleDisciplineChange(adminDisciplineId, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminView, adminDisciplineId, disciplines, groups]);

  useEffect(() => {
    if (
      !adminView ||
      !adminGroupId ||
      !selectedDiscipline ||
      disciplineGroups.length === 0 ||
      selectedGroupId === adminGroupId
    ) {
      return;
    }

    const group = disciplineGroups.find((item) => item.id === adminGroupId);
    if (group) {
      void handleGroupSelect(group, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminView, adminGroupId, selectedDiscipline, disciplineGroups]);

  useEffect(() => {
    if (
      !adminView ||
      !adminStudentId ||
      !selectedDiscipline ||
      !selectedGroupId ||
      groupStudents.length === 0 ||
      selectedStudent?.id === adminStudentId
    ) {
      return;
    }

    const student = groupStudents.find((item) => item.id === adminStudentId);
    if (student) {
      void handleStudentSelect(student, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminView, adminStudentId, selectedDiscipline, selectedGroupId, groupStudents]);

  const studentSummary = useMemo(() => {
    if (!studentState) {
      return {
        total: 0,
        accepted: 0,
        underReview: 0,
        overdue: 0,
        untouched: 0,
        completion: 0,
      };
    }

    const latestReports = getLatestReportsByTask(studentState.reports);
    const accepted = Object.values(latestReports).filter(
      (report) =>
        report.status === ReportStatus.Accepted ||
        report.status === ReportStatus.Checked
    ).length;
    const underReview = Object.values(latestReports).filter(
      (report) => report.status === ReportStatus.Submitted
    ).length;
    const overdue = studentState.tasks.filter((task) =>
      isStudentTaskOverdue(task, latestReports[task.id])
    ).length;
    const total = studentState.tasks.length;

    return {
      total,
      accepted,
      underReview,
      overdue,
      untouched: Math.max(total - accepted - underReview - overdue, 0),
      completion: total > 0 ? Math.round((accepted / total) * 100) : 0,
    };
  }, [studentState]);

  const studentWeekly = useMemo(
    () => buildWeeklyActivity(studentState?.reports ?? []),
    [studentState]
  );

  const teacherWeekly = useMemo(() => {
    const items = teacherState.analytics?.weeklySubmissions ?? [];
    return items.map((item) => ({
      key: item.weekStart,
      label: item.label,
      count: item.count,
    }));
  }, [teacherState.analytics]);

  const averageGradeReports =
    studentState?.reports.filter((report) => report.grade != null) ?? [];
  const averageGrade =
    averageGradeReports.length > 0
      ? Math.round(
          (averageGradeReports.reduce((sum, report) => sum + (report.grade ?? 0), 0) /
            averageGradeReports.length) *
            10
        ) / 10
      : 0;
  const selectedDisciplineStats = selectedDiscipline
    ? {
        groupsCount: disciplineGroups.length,
        tasksCount: disciplineTasks.length,
      }
    : null;
  const selectedStudentDisciplineReports = useMemo(() => {
    const taskIds = new Set(disciplineTasks.map((task) => task.id));
    return selectedStudentReports.filter((report) => taskIds.has(report.taskId));
  }, [disciplineTasks, selectedStudentReports]);
  const selectedStudentWeekly = useMemo(
    () => buildWeeklyActivity(selectedStudentDisciplineReports),
    [selectedStudentDisciplineReports]
  );
  const disciplineTopStudents = useMemo(
    () => buildStudentTopMetrics(disciplineStudentReports, disciplineTasks).slice(0, 5),
    [disciplineStudentReports, disciplineTasks]
  );
  const groupTopStudents = useMemo(
    () => buildStudentTopMetrics(groupStudentReports, disciplineTasks),
    [groupStudentReports, disciplineTasks]
  );
  const disciplineOverview = useMemo(
    () => buildSubmissionOverviewFromEntries(disciplineStudentReports, disciplineTasks),
    [disciplineStudentReports, disciplineTasks]
  );
  const groupOverview = useMemo(
    () => buildSubmissionOverviewFromEntries(groupStudentReports, disciplineTasks),
    [groupStudentReports, disciplineTasks]
  );
  const disciplineWeekly = useMemo(
    () => {
      const taskIds = new Set(disciplineTasks.map((task) => task.id));
      return buildWeeklyActivity(
        disciplineStudentReports
          .flatMap((entry) => entry.reports)
          .filter((report) => taskIds.has(report.taskId))
      );
    },
    [disciplineStudentReports, disciplineTasks]
  );
  const groupWeekly = useMemo(
    () => {
      const taskIds = new Set(disciplineTasks.map((task) => task.id));
      return buildWeeklyActivity(
        groupStudentReports
          .flatMap((entry) => entry.reports)
          .filter((report) => taskIds.has(report.taskId))
      );
    },
    [groupStudentReports, disciplineTasks]
  );

  if (!studentView && !teacherView && !isLoading) {
    return (
      <div className={s.statistics}>
        <Alert variant="info">
          Статистика доступна студентам, старостам, преподавателям и администратору.
        </Alert>
      </div>
    );
  }

  return (
    <div className={s.statistics}>
      <header className={s.header}>
        <div>
          <span className={s.eyebrow}>
            {studentView ? 'Студент' : adminView ? 'Администратор' : 'Преподаватель'}
          </span>
          <h1>Статистика</h1>
          <p>
            {studentView
              ? `Персональная статистика по заданиям и дисциплинам${studentState?.fullName ? `: ${studentState.fullName}` : ''}.`
              : adminView
              ? 'Статистика администратора по дисциплинам, группам и студентам.'
              : 'Аналитика по заданиям, студентам, сдачам и дисциплинам.'}
          </p>
        </div>

        <Button
          variant="primary"
          className={s.refreshButton}
          onClick={loadData}
          disabled={isLoading}
        >
          <FaRedo />
          Обновить
        </Button>
      </header>

      {error && <Alert variant="danger">{error}</Alert>}

      {isLoading ? (
        <div className={s.loading}>
          <Spinner animation="border" size="sm" />
          <span>Загрузка статистики...</span>
        </div>
      ) : studentView ? (
        <>
          <section className={s.metricGrid}>
            <MetricCard
              icon={<FaTasks />}
              label="Всего заданий"
              value={studentSummary.total}
              tone="blue"
            />
            <MetricCard
              icon={<FaCheckCircle />}
              label="Сдано"
              value={studentSummary.accepted}
              tone="green"
            />
            <MetricCard
              icon={<FaClock />}
              label="На проверке"
              value={studentSummary.underReview}
              tone="amber"
            />
            <MetricCard
              icon={<FaExclamationTriangle />}
              label="Просрочено"
              value={studentSummary.overdue}
              tone="red"
            />
          </section>

          <section className={s.dashboardGrid}>
            <article className={s.panel}>
              <div className={s.panelTitle}>
                <FaCheckCircle />
                <h2>{'\u0412\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435 \u0437\u0430\u0434\u0430\u043d\u0438\u0439'}</h2>
              </div>

              <div className={s.donutLayout}>
                <div
                  className={s.donut}
                  style={{
                    background: buildStatusGradient({
                      accepted: studentSummary.accepted,
                      pending: studentSummary.underReview,
                      overdue: studentSummary.overdue,
                      untouched: studentSummary.untouched,
                    }),
                  }}
                >
                  <span>{studentSummary.completion}%</span>
                  <small>сдано</small>
                </div>
                <div className={s.legend}>
                  <span>
                    <i className={s.successDot} />
                    Сдано: {studentSummary.accepted}
                  </span>
                  <span>
                    <i className={s.warningDot} />
                    На проверке: {studentSummary.underReview}
                  </span>
                  <span>
                    <i className={s.dangerDot} />
                    Просрочено: {studentSummary.overdue}
                  </span>
                  <span>
                    <i className={s.mutedDot} />
                    Без сдачи: {studentSummary.untouched}
                  </span>
                </div>
              </div>
            </article>

            <LineChart items={studentWeekly} title="Активность по неделям" />

            <article className={`${s.panel} ${s.widePanel}`}>
              <div className={s.panelTitle}>
                <FaBookOpen />
                <h2>{'\u0421\u0440\u0435\u0434\u043d\u0438\u0439 \u0431\u0430\u043b\u043b \u043f\u043e \u0434\u0438\u0441\u0446\u0438\u043f\u043b\u0438\u043d\u0430\u043c'}</h2>
              </div>

              {!studentState ||
              buildDisciplineAverages(studentState.tasks, studentState.reports).length ===
                0 ? (
                <EmptyState text="Оценок по дисциплинам пока нет" />
              ) : (
                <div className={s.disciplineList}>
                  {buildDisciplineAverages(
                    studentState.tasks,
                    studentState.reports
                  ).map((item) => (
                    <div className={s.disciplineRow} key={item.disciplineId}>
                      <div className={s.disciplineInfo}>
                        <strong>{item.disciplineName}</strong>
                        <span>{item.gradedReports} оценок</span>
                      </div>
                      <div className={s.barTrack}>
                        <span
                          className={s.barFill}
                          style={{ width: `${Math.min(item.averageGrade * 10, 100)}%` }}
                        />
                      </div>
                      <b>{formatGrade(item.averageGrade)}</b>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className={s.panel}>
              <div className={s.panelTitle}>
                <FaBookOpen />
                <h2>{'\u0423\u0447\u0435\u0431\u043d\u0430\u044f \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u044c'}</h2>
              </div>

              <div className={s.studyGrid}>
                <div className={s.studyItem}>
                  <span>Отчётов отправлено</span>
                  <strong>{studentState?.reports.length ?? 0}</strong>
                </div>
                <div className={s.studyItem}>
                  <span>Средний балл</span>
                  <strong>{averageGrade || '—'}</strong>
                </div>
                <div className={s.studyItem}>
                  <span>Новых уведомлений</span>
                  <strong>
                    {studentState?.notifications.filter((item) => !item.seen).length ?? 0}
                  </strong>
                </div>
                <div className={s.studyItem}>
                  <span>О заданиях</span>
                  <strong>
                    {studentState?.notifications.filter(
                      (item) => item.type === AnnouncementType.TaskCreated
                    ).length ?? 0}
                  </strong>
                </div>
              </div>
            </article>
          </section>
        </>
      ) : (
        <>
          {adminView && (
            <section className={s.adminSelector}>
              <div className={s.selectorRow}>
                <select
                  value={selectedDiscipline?.id ?? ''}
                  onChange={(event) =>
                    handleDisciplineChange(
                      event.target.value ? Number(event.target.value) : null
                    )
                  }
                  className={s.selector}
                >
                  <option value="">
                    {'\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0434\u0438\u0441\u0446\u0438\u043f\u043b\u0438\u043d\u0443'}
                  </option>
                  {disciplines.map((discipline) => (
                    <option key={discipline.id} value={discipline.id}>
                      {discipline.name}
                    </option>
                  ))}
                </select>
              </div>
            </section>
          )}

          {(!adminView || !selectedDiscipline) && (
            <>
          <section className={s.metricGrid}>
            <MetricCard
              icon={<FaTasks />}
              label="Заданий выдано"
              value={teacherState.statistics?.totalTasks ?? 0}
              tone="blue"
            />
            <MetricCard
              icon={<FaClock />}
              label="На проверке"
              value={teacherState.statistics?.pendingReviewReports ?? 0}
              tone="amber"
            />
            <MetricCard
              icon={<FaExclamationTriangle />}
              label="Просрочено"
              value={teacherState.statistics?.overdueTasks ?? 0}
              tone="red"
            />
            <MetricCard
              icon={<FaCheckCircle />}
              label="Принято сдач"
              value={
                teacherState.analytics?.submissionOverview.submitted ??
                teacherState.statistics?.acceptedReports ??
                0
              }
              tone="green"
            />
          </section>

          <section className={s.dashboardGrid}>
            <article className={s.panel}>
              <div className={s.panelTitle}>
                <FaUsers />
                <h2>{'\u0421\u0442\u0430\u0442\u0443\u0441 \u0441\u0434\u0430\u0447'}</h2>
              </div>

              <div className={s.donutLayout}>
                <div
                  className={s.donut}
                  style={{
                    background: buildStatusGradient({
                      accepted:
                        teacherState.analytics?.submissionOverview.submitted ?? 0,
                      pending:
                        teacherState.statistics?.pendingReviewReports ?? 0,
                      overdue: teacherState.statistics?.overdueTasks ?? 0,
                    }),
                  }}
                >
                  <span>{teacherState.statistics?.totalTasks ?? 0}</span>
                  <small>заданий</small>
                </div>
                <div className={s.legend}>
                  <span>
                    <i className={s.successDot} />
                    Принято: {teacherState.analytics?.submissionOverview.submitted ?? 0}
                  </span>
                  <span>
                    <i className={s.warningDot} />
                    На проверке: {teacherState.statistics?.pendingReviewReports ?? 0}
                  </span>
                  <span>
                    <i className={s.dangerDot} />
                    Просрочено: {teacherState.statistics?.overdueTasks ?? 0}
                  </span>
                </div>
              </div>
            </article>

            <LineChart items={teacherWeekly} title="Динамика сдач" />

            <article className={`${s.panel} ${s.widePanel}`}>
              <div className={s.panelTitle}>
                <FaBookOpen />
                <h2>{'\u0421\u0440\u0435\u0434\u043d\u0438\u0435 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0435\u043b\u0438 \u043f\u043e \u0434\u0438\u0441\u0446\u0438\u043f\u043b\u0438\u043d\u0430\u043c'}</h2>
              </div>

              {!teacherState.analytics ||
              teacherState.analytics.disciplineAverageGrades.length === 0 ? (
                <EmptyState text="Оценок по дисциплинам пока нет" />
              ) : (
                <div className={s.disciplineList}>
                  {teacherState.analytics.disciplineAverageGrades.map((item) => (
                    <div className={s.disciplineRow} key={item.disciplineId}>
                      <div className={s.disciplineInfo}>
                        <strong>{item.disciplineName}</strong>
                        <span>{item.gradedReports} проверенных работ</span>
                      </div>
                      <div className={s.barTrack}>
                        <span
                          className={s.barFill}
                          style={{ width: `${Math.max(item.averageGrade, 4)}%` }}
                        />
                      </div>
                      <b>{formatGrade(item.averageGrade)}</b>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className={s.panel}>
              <div className={s.panelTitle}>
                <FaUsers />
                <h2>{'\u0410\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u044c \u0441\u0442\u0443\u0434\u0435\u043d\u0442\u043e\u0432'}</h2>
              </div>

              {!teacherState.analytics ||
              teacherState.analytics.topStudents.length === 0 ? (
                <EmptyState text="Активность появится после первых оценок" />
              ) : (
                <div className={s.topList}>
                  {teacherState.analytics.topStudents.map((student, index) => (
                    <div className={s.topStudent} key={student.studentId}>
                      <span>{index + 1}</span>
                      <strong>{student.studentName}</strong>
                      <b>{formatGrade(student.averageGrade)}</b>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
            </>
          )}

          {adminView && selectedDiscipline && !selectedGroupId && !selectedStudent && (
            <section className={s.metricGrid}>
              <MetricCard
                icon={<FaBookOpen />}
                label={'\u0414\u0438\u0441\u0446\u0438\u043f\u043b\u0438\u043d\u0430'}
                value={selectedDiscipline.name}
                tone="blue"
              />
              <MetricCard
                icon={<FaTasks />}
                label={'\u0417\u0430\u0434\u0430\u043d\u0438\u0439'}
                value={selectedDisciplineStats?.tasksCount ?? 0}
                tone="green"
              />
              <MetricCard
                icon={<FaUsers />}
                label={'\u0413\u0440\u0443\u043f\u043f'}
                value={selectedDisciplineStats?.groupsCount ?? 0}
                tone="amber"
              />
              <MetricCard
                icon={<FaChartLine />}
                label={'\u0423\u0440\u043e\u0432\u0435\u043d\u044c'}
                value={disciplineGroups.length > 0 ? '\u0410\u043a\u0442\u0438\u0432\u043d\u043e' : '\u041d\u0435\u0442 \u0433\u0440\u0443\u043f\u043f'}
                tone="red"
              />
            </section>
          )}

          {adminView && selectedDiscipline && !selectedStudent && (
            <section className={s.quickNav}>
              <button
                type="button"
                onClick={() => scrollToAdminSection('admin-groups')}
              >
                <FaUsers />
                <span>{'\u0413\u0440\u0443\u043f\u043f\u044b'}</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToAdminSection('admin-top-students')}
              >
                <FaUser />
                <span>{'\u041b\u0443\u0447\u0448\u0438\u0435 \u0441\u0442\u0443\u0434\u0435\u043d\u0442\u044b'}</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToAdminSection('admin-chart')}
              >
                <FaChartLine />
                <span>{'\u0413\u0440\u0430\u0444\u0438\u043a'}</span>
              </button>
              <button
                type="button"
                onClick={() => scrollToAdminSection('admin-summary')}
              >
                <FaCheckCircle />
                <span>{'\u0421\u0432\u043e\u0434\u043a\u0430'}</span>
              </button>
            </section>
          )}

          {adminView && selectedDiscipline && !selectedGroupId && !selectedStudent && (
            <section className={s.dashboardGrid}>
              <article className={s.panel} id="admin-summary">
                <div className={s.panelTitle}>
                  <FaCheckCircle />
                  <h2>{'\u0421\u0442\u0430\u0442\u0443\u0441 \u0441\u0434\u0430\u0447'}</h2>
                </div>

                <div className={s.donutLayout}>
                  <div
                    className={s.donut}
                    style={{ background: buildStatusGradient(disciplineOverview) }}
                  >
                    <span>{disciplineOverview.accepted}</span>
                    <small>{'\u0441\u0434\u0430\u043d\u043e'}</small>
                  </div>
                  <div className={s.legend}>
                    <span>
                      <i className={s.successDot} />
                      {'\u0421\u0434\u0430\u043d\u043e'}: {disciplineOverview.accepted}
                    </span>
                    <span>
                      <i className={s.warningDot} />
                      {'\u041d\u0430 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0435'}: {disciplineOverview.pending}
                    </span>
                    <span>
                      <i className={s.dangerDot} />
                      {'\u041f\u0440\u043e\u0441\u0440\u043e\u0447\u0435\u043d\u043e'}: {disciplineOverview.overdue}
                    </span>
                    <span>
                      <i className={s.mutedDot} />
                      {'\u0411\u0435\u0437 \u0441\u0434\u0430\u0447\u0438'}: {disciplineOverview.untouched}
                    </span>
                  </div>
                </div>
              </article>

              <div id="admin-chart">
                <LineChart
                  items={disciplineWeekly}
                  title={'\u0414\u0438\u043d\u0430\u043c\u0438\u043a\u0430 \u0441\u0434\u0430\u0447'}
                />
              </div>

              <article
                className={`${s.panel} ${s.widePanel}`}
                id="admin-top-students"
              >
                <div className={s.panelTitle}>
                  <FaUsers />
                  <h2>{'\u041b\u0443\u0447\u0448\u0438\u0435 \u0441\u0442\u0443\u0434\u0435\u043d\u0442\u044b'}</h2>
                </div>

                {disciplineTopStudents.length === 0 ? (
                  <EmptyState text={'\u041e\u0446\u0435\u043d\u043e\u043a \u043f\u043e \u0434\u0438\u0441\u0446\u0438\u043f\u043b\u0438\u043d\u0435 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442'} />
                ) : (
                  <div className={s.topList}>
                    {disciplineTopStudents.map((student, index) => (
                      <div className={s.topStudent} key={student.studentId}>
                        <span>{index + 1}</span>
                        <strong>
                          {student.studentName} · {student.groupName}
                        </strong>
                        <b>{formatGrade(student.averageGrade)}</b>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className={s.panel}>
                <div className={s.panelTitle}>
                  <FaChartLine />
                  <h2>{'\u0421\u0440\u0435\u0437 \u043f\u043e \u043f\u0440\u0435\u043f\u043e\u0434\u0430\u0432\u0430\u0442\u0435\u043b\u044e'}</h2>
                </div>

                <div className={s.studyGrid}>
                  <div className={s.studyItem}>
                    <span>{'\u0417\u0430\u0434\u0430\u043d\u0438\u0439'}</span>
                    <strong>{disciplineTasks.length}</strong>
                  </div>
                  <div className={s.studyItem}>
                    <span>{'\u0413\u0440\u0443\u043f\u043f'}</span>
                    <strong>{disciplineGroups.length}</strong>
                  </div>
                  <div className={s.studyItem}>
                    <span>{'\u041e\u0446\u0435\u043d\u043e\u043a'}</span>
                    <strong>
                      {disciplineTopStudents.reduce(
                        (sum, student) => sum + student.gradedReports,
                        0
                      )}
                    </strong>
                  </div>
                  <div className={s.studyItem}>
                    <span>{'\u0421\u0440\u0435\u0434\u043d\u0438\u0439 \u0431\u0430\u043b\u043b'}</span>
                    <strong>
                      {disciplineTopStudents.length > 0
                        ? formatGrade(
                            disciplineTopStudents.reduce(
                              (sum, student) => sum + student.averageGrade,
                              0
                            ) / disciplineTopStudents.length
                          )
                        : '-'}
                    </strong>
                  </div>
                </div>
              </article>
            </section>
          )}

          {adminView && selectedGroupId && !selectedStudent && (
            <>
              <section className={s.metricGrid}>
                <MetricCard
                  icon={<FaUsers />}
                  label={'\u0413\u0440\u0443\u043f\u043f\u0430'}
                  value={selectedGroupName}
                  tone="blue"
                />
                <MetricCard
                  icon={<FaUser />}
                  label={'\u0421\u0442\u0443\u0434\u0435\u043d\u0442\u043e\u0432'}
                  value={groupStudents.length}
                  tone="green"
                />
                <MetricCard
                  icon={<FaCheckCircle />}
                  label={'\u041e\u0446\u0435\u043d\u043e\u043a'}
                  value={groupMetric?.gradedReports ?? 0}
                  tone="amber"
                />
                <MetricCard
                  icon={<FaChartLine />}
                  label={'\u0421\u0440\u0435\u0434\u043d\u0438\u0439 \u0431\u0430\u043b\u043b'}
                  value={groupMetric ? formatGrade(groupMetric.averageGrade) : '-'}
                  tone="red"
                />
              </section>

              <section className={s.dashboardGrid}>
                <article className={s.panel} id="admin-summary">
                  <div className={s.panelTitle}>
                    <FaCheckCircle />
                    <h2>{'\u0421\u0442\u0430\u0442\u0443\u0441 \u0441\u0434\u0430\u0447'}</h2>
                  </div>

                  <div className={s.donutLayout}>
                    <div
                      className={s.donut}
                      style={{ background: buildStatusGradient(groupOverview) }}
                    >
                      <span>{groupOverview.accepted}</span>
                      <small>{'\u0441\u0434\u0430\u043d\u043e'}</small>
                    </div>
                    <div className={s.legend}>
                      <span>
                        <i className={s.successDot} />
                        {'\u0421\u0434\u0430\u043d\u043e'}: {groupOverview.accepted}
                      </span>
                      <span>
                        <i className={s.warningDot} />
                        {'\u041d\u0430 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0435'}: {groupOverview.pending}
                      </span>
                      <span>
                        <i className={s.dangerDot} />
                        {'\u041f\u0440\u043e\u0441\u0440\u043e\u0447\u0435\u043d\u043e'}: {groupOverview.overdue}
                      </span>
                      <span>
                        <i className={s.mutedDot} />
                        {'\u0411\u0435\u0437 \u0441\u0434\u0430\u0447\u0438'}: {groupOverview.untouched}
                      </span>
                    </div>
                  </div>
                </article>

                <div id="admin-chart">
                  <LineChart
                    items={groupWeekly}
                    title={'\u0410\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u044c \u0433\u0440\u0443\u043f\u043f\u044b'}
                  />
                </div>

              </section>
            </>
          )}

          {adminView && selectedStudent && studentDetails && (
            <>
              <section className={s.metricGrid}>
                <MetricCard
                  icon={<FaTasks />}
                  label={'\u0412\u0441\u0435\u0433\u043e \u0437\u0430\u0434\u0430\u043d\u0438\u0439'}
                  value={studentDetails.totalTasks}
                  tone="blue"
                />
                <MetricCard
                  icon={<FaCheckCircle />}
                  label={'\u0421\u0434\u0430\u043d\u043e'}
                  value={studentDetails.accepted}
                  tone="green"
                />
                <MetricCard
                  icon={<FaClock />}
                  label={'\u041d\u0430 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0435'}
                  value={studentDetails.underReview}
                  tone="amber"
                />
                <MetricCard
                  icon={<FaExclamationTriangle />}
                  label={'\u041f\u0440\u043e\u0441\u0440\u043e\u0447\u0435\u043d\u043e'}
                  value={studentDetails.overdue}
                  tone="red"
                />
              </section>

              <section className={s.dashboardGrid}>
                <article className={s.panel}>
                  <div className={s.panelTitle}>
                    <FaCheckCircle />
                    <h2>{'\u0412\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435 \u0437\u0430\u0434\u0430\u043d\u0438\u0439'}</h2>
                  </div>

                  <div className={s.donutLayout}>
                    <div
                      className={s.donut}
                      style={{
                        background: buildStatusGradient({
                          accepted: studentDetails.accepted,
                          pending: studentDetails.underReview,
                          overdue: studentDetails.overdue,
                          untouched: studentDetails.untouched,
                        }),
                      }}
                    >
                      <span>{studentDetails.completion}%</span>
                      <small>{'\u0441\u0434\u0430\u043d\u043e'}</small>
                    </div>
                    <div className={s.legend}>
                      <span>
                        <i className={s.successDot} />
                        {'\u0421\u0434\u0430\u043d\u043e'}: {studentDetails.accepted}
                      </span>
                      <span>
                        <i className={s.warningDot} />
                        {'\u041d\u0430 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0435'}: {studentDetails.underReview}
                      </span>
                      <span>
                        <i className={s.dangerDot} />
                        {'\u041f\u0440\u043e\u0441\u0440\u043e\u0447\u0435\u043d\u043e'}: {studentDetails.overdue}
                      </span>
                      <span>
                        <i className={s.mutedDot} />
                        {'\u0411\u0435\u0437 \u0441\u0434\u0430\u0447\u0438'}: {studentDetails.untouched}
                      </span>
                    </div>
                  </div>
                </article>

                <LineChart
                  items={selectedStudentWeekly}
                  title={'\u0410\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u044c \u043f\u043e \u043d\u0435\u0434\u0435\u043b\u044f\u043c'}
                />

                <article className={`${s.panel} ${s.widePanel}`}>
                  <div className={s.panelTitle}>
                    <FaUser />
                    <h2>{studentDetails.fullName}</h2>
                  </div>

                  <div className={s.disciplineList}>
                    <div className={s.disciplineRow}>
                      <div className={s.disciplineInfo}>
                        <strong>{studentDetails.disciplineName}</strong>
                        <span>
                          {studentDetails.gradedReports}{' '}
                          {'\u043e\u0446\u0435\u043d\u043e\u043a'}
                        </span>
                      </div>
                      <div className={s.barTrack}>
                        <span
                          className={s.barFill}
                          style={{ width: `${Math.min(studentDetails.averageGrade * 10, 100)}%` }}
                        />
                      </div>
                      <b>{formatGrade(studentDetails.averageGrade)}</b>
                    </div>
                  </div>
                </article>

                <article className={s.panel}>
                  <div className={s.panelTitle}>
                    <FaBookOpen />
                    <h2>{'\u0423\u0447\u0435\u0431\u043d\u0430\u044f \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u044c'}</h2>
                  </div>

                  <div className={s.studyGrid}>
                    <div className={s.studyItem}>
                      <span>{'\u041e\u0442\u0447\u0435\u0442\u043e\u0432 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u043e'}</span>
                      <strong>{selectedStudentDisciplineReports.length}</strong>
                    </div>
                    <div className={s.studyItem}>
                      <span>{'\u0421\u0440\u0435\u0434\u043d\u0438\u0439 \u0431\u0430\u043b\u043b'}</span>
                      <strong>{studentDetails.averageGrade || '-'}</strong>
                    </div>
                    <div className={s.studyItem}>
                      <span>{'\u0414\u0438\u0441\u0446\u0438\u043f\u043b\u0438\u043d\u0430'}</span>
                      <strong>{studentDetails.disciplineName}</strong>
                    </div>
                    <div className={s.studyItem}>
                      <span>{'\u0413\u0440\u0443\u043f\u043f\u0430'}</span>
                      <strong>{selectedGroupName}</strong>
                    </div>
                  </div>
                </article>
              </section>
            </>
          )}

          {adminView && selectedDiscipline && !selectedStudent && (
            <section className={s.adminGrid}>
              {!selectedGroupId && !selectedStudent && (
              <article className={`${s.panel} ${s.widePanel}`} id="admin-groups">
                <div className={s.panelTitle}>
                  <FaBookOpen />
                  <h2>{'\u0421\u043f\u0438\u0441\u043e\u043a \u0441\u0442\u0443\u0434\u0435\u043d\u0442\u043e\u0432'}</h2>
                </div>


                {selectedDiscipline ? (
                  <>
                    <div className={s.detailCard}>
                      <span>{'\u0414\u0438\u0441\u0446\u0438\u043f\u043b\u0438\u043d\u0430'}</span>
                      <span>Р”РёСЃС†РёРїР»РёРЅР°</span>
                      <strong>{selectedDiscipline.name}</strong>
                      <small>
                        {selectedDisciplineStats?.tasksCount ?? 0}{' '}
                        {'\u0437\u0430\u0434\u0430\u0447'},{' '}
                        {selectedDisciplineStats?.groupsCount ?? 0}{' '}
                        {'\u0433\u0440\u0443\u043f\u043f'}
                      </small>
                      <small>
                        {selectedDisciplineStats?.tasksCount ?? 0} Р·Р°РґР°С‡,{' '}
                        {selectedDisciplineStats?.groupsCount ?? 0} РіСЂСѓРїРї
                      </small>
                    </div>

                    {disciplineGroups.length > 0 ? (
                    <div className={s.groupList}>
                      {disciplineGroups.map((group) => (
                        <button
                          key={group.id}
                          type="button"
                          className={s.groupRow}
                          onClick={() => handleGroupSelect(group)}
                        >
                          <span>{group.name}</span>
                          <b>Открыть</b>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyState text="Нет групп с выбранной дисциплиной" />
                    )}
                  </>
                ) : (
                  <EmptyState text="Выберите дисциплину, чтобы увидеть группы" />
                )}
              </article>
              )}

              {(!selectedDiscipline || (selectedGroupId && !selectedStudent)) && (
              <article className={s.panel}>
                <div className={s.panelTitle}>
                  <FaUsers />
                  <h2>{'\u0421\u043f\u0438\u0441\u043e\u043a \u0441\u0442\u0443\u0434\u0435\u043d\u0442\u043e\u0432'}</h2>
                </div>

                {selectedGroupId ? (
                  <>
                    <div className={s.studentList}>
                      {groupStudents
                        .slice()
                        .sort((a, b) => {
                          const aMetric = groupTopStudents.find(
                            (item) => item.studentId === a.id
                          );
                          const bMetric = groupTopStudents.find(
                            (item) => item.studentId === b.id
                          );

                          return (
                            (bMetric?.averageGrade ?? 0) -
                              (aMetric?.averageGrade ?? 0) ||
                            a.user.fullName.localeCompare(b.user.fullName, 'ru-RU')
                          );
                        })
                        .map((student) => {
                          const metric = groupTopStudents.find(
                            (item) => item.studentId === student.id
                          );

                          return (
                            <button
                              type="button"
                              key={student.id}
                              className={s.studentRow}
                              onClick={() => handleStudentSelect(student)}
                            >
                              <span>{student.user.fullName}</span>
                              <b>
                                {metric?.averageGrade
                                  ? formatGrade(metric.averageGrade)
                                  : '-'}
                              </b>
                            </button>
                          );
                        })}
                    </div>
                  </>
                ) : (
                  <EmptyState text="Выберите группу для просмотра" />
                )}
              </article>
              )}

              {(!selectedDiscipline || selectedStudent) && (
              <article className={s.panel}>
                <div className={s.panelTitle}>
                  <FaUser />
                  <h2>{'\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430 \u0441\u0442\u0443\u0434\u0435\u043d\u0442\u0430'}</h2>
                </div>

                {selectedStudent && studentDetails ? (
                  <div className={s.disciplineList}>
                    <div className={s.disciplineRow}>
                      <div className={s.disciplineInfo}>
                        <strong>{studentDetails.fullName}</strong>
                        <span>{studentDetails.disciplineName}</span>
                      </div>
                      <div className={s.barTrack}>
                        <span
                          className={s.barFill}
                          style={{ width: `${Math.min(studentDetails.averageGrade * 10, 100)}%` }}
                        />
                      </div>
                      <b>{formatGrade(studentDetails.averageGrade)}</b>
                    </div>
                    <div className={s.studyGrid}>
                      <div className={s.studyItem}>
                        <span>Всего заданий</span>
                        <strong>{studentDetails.totalTasks}</strong>
                      </div>
                      <div className={s.studyItem}>
                        <span>Сдано</span>
                        <strong>{studentDetails.accepted}</strong>
                      </div>
                      <div className={s.studyItem}>
                        <span>На проверке</span>
                        <strong>{studentDetails.underReview}</strong>
                      </div>
                      <div className={s.studyItem}>
                        <span>Просрочено</span>
                        <strong>{studentDetails.overdue}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState text="Выберите студента, чтобы увидеть детальную статистику" />
                )}
              </article>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};
