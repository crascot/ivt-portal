import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AuthProvider } from '@context/AuthContext';
import { AnnouncementProvider } from '@context/AnnouncementContext';
import ProtectedRoute from '@components/ProtectedRoute/ProtectedRoute';

import { Container } from '@components/Container/Container';
import { DeadlineToasts } from '@components/Toast/DeadlineToasts';
import { LessonStartingToasts } from '@components/Toast/LessonStartingToasts';

import Home from '@pages/home';
import About from '@pages/about';
import Profile from '@pages/profile';
import SignIn from '@pages/sign-in';
import SignUp from '@pages/sign-up';
import PendingApproval from '@pages/pending-approval';
import PendingUsers from '@pages/pending-users';
import Groups from '@pages/groups';
import Disciplines from '@pages/discipline';
import NotFound from '@pages/not-found';
import Tasks from '@pages/tasks';
import TaskDetail from '@pages/task-detail';
import Teachers from '@pages/teachers';
import TeacherDetail from '@pages/teacher-detail';
import TeacherSchedulePage from '@pages/teacher-schedule';
import Statistics from '@pages/statistics';
import Umm from '@pages/umm';
import UmmDiscipline from '@pages/umm-discipline';
import UmmDetail from '@pages/umm-detail';
import NotificationsHistory from '@pages/notifications-history';

import { ROUTES } from '@utils/routes';
import { RoleEnum } from '@entities/role-enum';
import Schedule from '@pages/schedule';

const App = () => {
  return (
    <AuthProvider>
      <AnnouncementProvider>
        <BrowserRouter>
          <DeadlineToasts />
          <LessonStartingToasts />
          <Container>
            <Routes>
              <Route path={ROUTES.MAIN} element={<Home />} />
              <Route path={ROUTES.ABOUT} element={<About />} />

              <Route
                element={
                  <ProtectedRoute
                    guestOnly
                    authenticatedRedirectTo={ROUTES.PROFILE}
                  />
                }
              >
                <Route path={ROUTES.SIGN_IN} element={<SignIn />} />
                <Route path={ROUTES.SIGN_UP} element={<SignUp />} />

                <Route
                  path={ROUTES.PENDING_APPROVAL}
                  element={<PendingApproval />}
                />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path={ROUTES.PROFILE} element={<Profile />} />
                <Route path={ROUTES.SCHEDULE} element={<Schedule />} />
                <Route path={ROUTES.TEACHERS} element={<Teachers />} />
                <Route
                  path={ROUTES.TEACHER_DETAIL}
                  element={<TeacherDetail />}
                />
                <Route
                  path={ROUTES.TEACHER_SCHEDULE}
                  element={<TeacherSchedulePage />}
                />
                <Route path={ROUTES.TASKS} element={<Tasks />} />
                <Route path={ROUTES.TASK_DETAIL} element={<TaskDetail />} />
                <Route path={ROUTES.STATISTICS} element={<Statistics />} />
                <Route
                  path={ROUTES.ADMIN_STATISTICS_DISCIPLINE}
                  element={<Statistics />}
                />
                <Route
                  path={ROUTES.ADMIN_STATISTICS_GROUP}
                  element={<Statistics />}
                />
                <Route
                  path={ROUTES.ADMIN_STATISTICS_STUDENT}
                  element={<Statistics />}
                />
                <Route
                  path={ROUTES.NOTIFICATIONS_HISTORY}
                  element={<NotificationsHistory />}
                />
                <Route path={ROUTES.UMM} element={<Umm />} />
                <Route
                  path={ROUTES.UMM_DISCIPLINE}
                  element={<UmmDiscipline />}
                />
                <Route path={ROUTES.UMM_DETAIL} element={<UmmDetail />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={[RoleEnum.ADMIN]}
                    unauthorizedRedirectTo={ROUTES.MAIN}
                  />
                }
              >
                <Route
                  path={ROUTES.ADMIN_PENDING_USERS}
                  element={<PendingUsers />}
                />
                <Route path={ROUTES.ADMIN_GROUPS} element={<Groups />} />
                <Route
                  path={ROUTES.ADMIN_DISCIPLINES}
                  element={<Disciplines />}
                />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Container>
        </BrowserRouter>
      </AnnouncementProvider>
    </AuthProvider>
  );
};

export default App;
