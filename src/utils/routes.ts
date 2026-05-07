export enum ROUTES {
  MAIN = '/',
  ABOUT = '/about',
  SIGN_IN = '/sign-in',
  SIGN_UP = '/sign-up',
  PROFILE = '/profile',
  PENDING_APPROVAL = '/pending-approval',

  SCHEDULE = '/schedule',
  TASKS = '/tasks',
  STATISTICS = '/statistics',
  ADMIN_STATISTICS_DISCIPLINE = '/statistics/admin/discipline/:disciplineId',
  ADMIN_STATISTICS_GROUP = '/statistics/admin/discipline/:disciplineId/group/:groupId',
  ADMIN_STATISTICS_STUDENT = '/statistics/admin/discipline/:disciplineId/group/:groupId/student/:studentId',
  NOTIFICATIONS_HISTORY = '/notifications-history',
  UMM = '/umm',
  UMM_DETAIL = '/umm/:id',

  ADMIN_PENDING_USERS = '/admin/pending-users',
  ADMIN_GROUPS = '/admin/groups',
  ADMIN_DISCIPLINES = '/admin/disciplines',
}
