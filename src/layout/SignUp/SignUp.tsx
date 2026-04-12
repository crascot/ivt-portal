import { useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

import { AuthForm } from '@components/AuthForm/AuthForm';
import {
  GroupDto,
  RegisterStudentRequest,
  RegisterTeacherRequest,
} from '@entities/authRequest';
import { authApi } from '@api/authApi';
import { ROUTES } from '@utils/routes';

import s from './SignUp.module.css';
import { useMount } from '@utils/use-mount';
import { groupApi } from '@api/groupApi';

const benefits = [
  'Создайте аккаунт для доступа к материалам и заданиям',
  'Выберите тип регистрации и получите подходящий интерфейс',
  'Работайте с расписанием, дисциплинами и дедлайнами в одном месте',
];

type RegisterMode = 'student' | 'teacher';

export const SignUp = () => {
  const navigate = useNavigate();

  const [registerMode, setRegisterMode] = useState<RegisterMode>('student');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  async function handleStudentRegister(
    data: RegisterStudentRequest
  ): Promise<void> {
    setSubmitError(null);

    try {
      await authApi.registerStudent(data);

      navigate(ROUTES.PENDING_APPROVAL);
    } catch (error) {
      console.error('Student registration failed', error);
      setSubmitError(
        'Не удалось зарегистрировать студента. Проверьте введённые данные.'
      );
    }
  }

  async function handleTeacherRegister(
    data: RegisterTeacherRequest
  ): Promise<void> {
    setSubmitError(null);

    try {
      await authApi.registerTeacher(data);

      navigate(ROUTES.PENDING_APPROVAL);
    } catch (error) {
      console.error('Teacher registration failed', error);
      setSubmitError(
        'Не удалось зарегистрировать преподавателя. Проверьте введённые данные.'
      );
    }
  }

  useMount(() => {
    let cancelled = false;

    async function loadGroups(): Promise<void> {
      setGroupsLoading(true);

      try {
        const result = await groupApi.getAll();

        if (!cancelled) {
          setGroups(result);
        }
      } catch (error) {
        console.error('Failed to load groups', error);
      } finally {
        if (!cancelled) {
          setGroupsLoading(false);
        }
      }
    }

    loadGroups();

    return () => {
      cancelled = true;
    };
  });

  return (
    <div className={s.signUpPage}>
      <section className={s.infoBlock}>
        <span className={s.eyebrow}>Регистрация</span>

        <h1>Создайте аккаунт в IVT Portal</h1>

        <p className={s.lead}>
          Зарегистрируйтесь, чтобы получить доступ к учебным материалам,
          дисциплинам, заданиям, расписанию и возможностям портала.
        </p>

        <ul className={s.benefits}>
          {benefits.map((item) => (
            <li key={item} className={s.benefitItem}>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <Card className={s.formCard}>
        <Card.Body>
          <div className={s.formHeader}>
            <h2>Добро пожаловать</h2>
            <p>Выберите тип регистрации и заполните форму.</p>
          </div>

          <div className={s.modeSwitcher}>
            <Button
              type="button"
              variant={
                registerMode === 'student' ? 'primary' : 'outline-primary'
              }
              onClick={() => {
                setSubmitError(null);
                setRegisterMode('student');
              }}
            >
              Я студент
            </Button>

            <Button
              type="button"
              variant={
                registerMode === 'teacher' ? 'primary' : 'outline-primary'
              }
              onClick={() => {
                setSubmitError(null);
                setRegisterMode('teacher');
              }}
            >
              Я преподаватель
            </Button>
          </div>

          {registerMode === 'student' ? (
            <AuthForm
              mode="register-student"
              groups={groups}
              onSubmit={handleStudentRegister}
              submitText="Зарегистрироваться как студент"
              submitError={submitError}
              isLoading={groupsLoading}
            />
          ) : (
            <AuthForm
              mode="register-teacher"
              onSubmit={handleTeacherRegister}
              submitText="Зарегистрироваться как преподаватель"
              submitError={submitError}
            />
          )}

          <p className={s.footerText}>
            Уже есть аккаунт?{' '}
            <Link to={ROUTES.SIGN_IN} className={s.footerLink}>
              Войти
            </Link>
          </p>
        </Card.Body>
      </Card>
    </div>
  );
};
