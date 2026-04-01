import { useState } from 'react';
import { Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

import { AuthForm } from '@components/AuthForm/AuthForm';
import { RegisterRequest } from '@entities/authRequest';
import api from '@utils/api';
import { ROUTES } from '@utils/routes';
import { useAuth } from '@context/AuthContext';

import s from './SignUp.module.css';

const benefits = [
  'Создайте аккаунт для доступа к материалам и заданиям',
  'Выберите роль и получите подходящий интерфейс',
  'Работайте с расписанием, дисциплинами и дедлайнами в одном месте',
];

export const SignUp = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleRegister(data: RegisterRequest): Promise<void> {
    setSubmitError(null);

    try {
      const response = await api.post('/auth/register', data);
      const result = response.data;

      if (result?.token) {
        login(result.token);
        navigate(ROUTES.PROFILE);
        return;
      }

      navigate(ROUTES.SIGN_IN);
    } catch (error) {
      console.error('Registration failed', error);
      setSubmitError(
        'Не удалось зарегистрироваться. Проверьте введённые данные.'
      );
    }
  }

  return (
    <div className={s.signUpPage}>
      <section className={s.infoBlock}>
        <span className={s.eyebrow}>Регистрация</span>

        <h1>Создайте аккаунт в IVT Portal</h1>

        <p className={s.lead}>
          Зарегистрируйтесь, чтобы получить доступ к учебным материалам,
          дисциплинам, заданиям, расписанию и возможностям портала в
          соответствии с вашей ролью.
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
            <p>Заполните форму, чтобы создать новый аккаунт.</p>
          </div>

          <AuthForm
            mode="register"
            onSubmit={handleRegister}
            submitText="Зарегистрироваться"
            submitError={submitError}
          />

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
