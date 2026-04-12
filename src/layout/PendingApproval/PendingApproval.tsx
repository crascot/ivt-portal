import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { ROUTES } from '@utils/routes';

import s from './PendingApproval.module.css';

export const PendingApproval = () => (
  <div className={s.pendingPage}>
    <Card className={s.pendingCard}>
      <Card.Body>
        <div className={s.icon}>⏳</div>

        <span className={s.eyebrow}>Заявка отправлена</span>

        <h1>Ожидайте подтверждения аккаунта</h1>

        <p className={s.lead}>
          Ваша заявка успешно создана и отправлена на рассмотрение
          администратору.
        </p>

        <p className={s.description}>
          После подтверждения аккаунта вы сможете войти в систему. Обычно
          проверка занимает некоторое время. Попробуйте авторизоваться позже.
        </p>

        <div className={s.infoBox}>
          <span className={s.infoTitle}>Что делать дальше</span>
          <ul className={s.steps}>
            <li>Дождитесь подтверждения вашей заявки.</li>
            <li>Через некоторое время попробуйте снова войти в систему.</li>
          </ul>
        </div>

        <div className={s.actions}>
          <Link to={ROUTES.SIGN_IN} className="btn btn-primary btn-lg">
            Перейти ко входу
          </Link>

          <Link to={ROUTES.MAIN} className="btn btn-outline-primary btn-lg">
            На главную
          </Link>
        </div>
      </Card.Body>
    </Card>
  </div>
);
