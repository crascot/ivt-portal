import { useState } from 'react';
import { Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

import { AuthForm } from '@components/AuthForm/AuthForm';
import { LoginRequest } from '@entities/authRequest';
import { ROUTES } from '@utils/routes';
import api from '@utils/api';
import { useAuth } from '@context/AuthContext';

import s from './SignIn.module.css';

const highlights = [
  'Доступ к учебным материалам и дисциплинам',
  'Просмотр расписания, заданий и дедлайнов',
  'Единое пространство для студентов и преподавателей',
];

export const SignIn = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleLogin(data: LoginRequest): Promise<void> {
    setSubmitError(null);

    try {
      const response = await api.post('/auth/login', data);
      const result = response.data;

      if (!result?.token) {
        throw new Error('Token was not returned');
      }

      login(result.token);
      navigate(ROUTES.PROFILE);
    } catch (error) {
      console.error('Login failed', error);
      setSubmitError('Не удалось войти. Проверьте email и пароль.');
    }
  }

  return (
    <div className={s.signInPage}>
      <section className={s.infoBlock}>
        <span className={s.eyebrow}>Авторизация</span>

        <h1>Вход в IVT Portal</h1>

        <p className={s.lead}>
          Войдите в систему, чтобы получить доступ к дисциплинам, учебным
          материалам, заданиям и личному кабинету.
        </p>

        <ul className={s.highlights}>
          {highlights.map((item) => (
            <li key={item} className={s.highlightItem}>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <Card className={s.formCard}>
        <Card.Body>
          <div className={s.formHeader}>
            <h2>Добро пожаловать</h2>
            <p>Введите свои данные для входа в систему.</p>
          </div>

          <AuthForm
            mode="login"
            onSubmit={handleLogin}
            submitText="Войти"
            submitError={submitError}
          />

          <p className={s.footerText}>
            Нет аккаунта?{' '}
            <Link to={ROUTES.SIGN_UP} className={s.footerLink}>
              Зарегистрироваться
            </Link>
          </p>
        </Card.Body>
      </Card>
    </div>
  );
};
