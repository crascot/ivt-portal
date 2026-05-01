import { Badge, Card, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { useAuth } from '@context/AuthContext';
import { ROUTES } from '@utils/routes';

import s from './Home.module.css';

const features = [
  {
    title: 'Учебные материалы',
    text: 'Храните и просматривайте УММ, лекции, методички и полезные документы в одном месте.',
  },
  {
    title: 'Расписание и дедлайны',
    text: 'Следите за занятиями, заданиями и важными сроками без лишнего хаоса.',
  },
  {
    title: 'Удобный доступ',
    text: 'Студенты, преподаватели и администраторы получают понятный интерфейс под свои задачи.',
  },
];

const quickLinks = [
  // {
  //   title: 'Профиль',
  //   text: 'Перейдите в личный кабинет и проверьте свои данные.',
  //   to: ROUTES.PROFILE,
  //   buttonText: 'Открыть профиль',
  //   buttonClassName: 'btn btn-primary',
  // },
  {
    title: 'О портале',
    text: 'Узнайте больше о возможностях и назначении системы.',
    to: ROUTES.ABOUT,
    buttonText: 'Подробнее',
    buttonClassName: 'btn btn-outline-primary',
  },
];

const defaultHeroStats = [
  {
    value: '3',
    label: 'основные роли',
  },
  {
    value: '24/7',
    label: 'доступ к материалам',
  },
  {
    value: '1',
    label: 'единая платформа',
  },
];

export const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className={s.homePage}>
      <section className={s.heroSection}>
        <div className={s.heroContent}>
          <Badge bg="primary" className={s.heroBadge}>
            IVT Portal
          </Badge>

          <h1>Цифровой портал кафедры ИВТ</h1>

          <p className={s.heroText}>
            Единое пространство для студентов, преподавателей и администрации:
            дисциплины, учебные материалы, расписание, задания и ключевые
            дедлайны в одном интерфейсе.
          </p>

          <div className={s.heroActions}>
            <Link
              to={isAuthenticated ? ROUTES.PROFILE : ROUTES.SIGN_IN}
              className="btn btn-primary btn-lg"
            >
              {isAuthenticated ? 'Профиль' : 'Войти в систему'}
            </Link>

            <Link to={ROUTES.ABOUT} className="btn btn-outline-primary btn-lg">
              Узнать больше
            </Link>
          </div>
        </div>

        <div className={s.heroStats}>
          {defaultHeroStats.map((stat) => (
            <Card key={stat.label} className={s.statCard}>
              <Card.Body>
                <span className={s.statValue}>{stat.value}</span>
                <span className={s.statLabel}>{stat.label}</span>
              </Card.Body>
            </Card>
          ))}
        </div>
      </section>

      <section className={s.section}>
        <div className={s.sectionHeading}>
          <h2>Быстрые действия</h2>
          <p>Начните работу с наиболее важными разделами портала.</p>
        </div>

        <Row className="g-4">
          {quickLinks.map((item) => (
            <Col key={item.title} xs={12} md={6}>
              <Card className={s.actionCard}>
                <Card.Body>
                  <Card.Title className={s.cardTitle}>{item.title}</Card.Title>
                  <Card.Text>{item.text}</Card.Text>
                  <Link to={item.to} className={item.buttonClassName}>
                    {item.buttonText}
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <section className={s.section}>
        <div className={s.sectionHeading}>
          <h2>Что даёт портал</h2>
          <p>
            Простой и современный интерфейс для повседневной учебной работы.
          </p>
        </div>

        <Row className="g-4">
          {features.map((feature) => (
            <Col key={feature.title} xs={12} md={6} xl={4}>
              <Card className={s.featureCard}>
                <Card.Body>
                  <Card.Title className={s.cardTitle}>
                    {feature.title}
                  </Card.Title>
                  <Card.Text>{feature.text}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </section>
    </div>
  );
};
