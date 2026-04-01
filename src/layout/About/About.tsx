import { Card, Col, Row } from 'react-bootstrap';

import s from './About.module.css';

const roles = [
  {
    title: 'Студенты',
    text: 'Получают доступ к дисциплинам, учебным материалам, заданиям, дедлайнам и расписанию в одном месте.',
  },
  {
    title: 'Преподаватели',
    text: 'Публикуют УММ, управляют дисциплинами, создают задания и отслеживают сдачи студентов.',
  },
  {
    title: 'Администраторы',
    text: 'Настраивают группы, семестры, справочники и поддерживают структуру портала в актуальном состоянии.',
  },
];

const advantages = [
  'Единое пространство для учебного процесса',
  'Понятный интерфейс для разных ролей',
  'Быстрый доступ к материалам и расписанию',
  'Централизованное управление заданиями и сроками',
];

export const About = () => (
  <div className={s.aboutPage}>
    <section className={s.heroSection}>
      <div className={s.heroContent}>
        <span className={s.eyebrow}>О системе</span>

        <h1>О портале IVT Portal</h1>

        <p className={s.heroText}>
          IVT Portal — это учебный веб-портал кафедры ИВТ, который объединяет
          учебные материалы, дисциплины, задания, расписание и ключевые
          организационные процессы в одном цифровом пространстве.
        </p>

        <p className={s.heroText}>
          Портал создан для того, чтобы упростить взаимодействие между
          студентами, преподавателями и администрацией, сделать учебный процесс
          более прозрачным и удобным.
        </p>
      </div>
    </section>

    <section className={s.section}>
      <div className={s.sectionHeading}>
        <h2>Для кого предназначен портал</h2>
        <p>
          Система учитывает разные сценарии работы и предоставляет удобный
          доступ к нужным функциям для каждой роли.
        </p>
      </div>

      <Row className="g-4">
        {roles.map((role) => (
          <Col key={role.title} xs={12} md={6} xl={4}>
            <Card className={s.infoCard}>
              <Card.Body>
                <Card.Title className={s.cardTitle}>{role.title}</Card.Title>
                <Card.Text>{role.text}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </section>

    <section className={s.section}>
      <div className={s.sectionHeading}>
        <h2>Ключевые преимущества</h2>
        <p>
          Портал помогает сделать учебную работу организованной и доступной.
        </p>
      </div>

      <Card className={s.advantagesCard}>
        <Card.Body>
          <ul className={s.advantagesList}>
            {advantages.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card.Body>
      </Card>
    </section>
  </div>
);
