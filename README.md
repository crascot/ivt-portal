# React TypeScript Webpack Boilerplate

Профессиональный boilerplate для разработки приложений с использованием React, TypeScript, Webpack, ESLint и React Router DOM.

## 🚀 Возможности

- **React 18** — современная версия React с JSX синтаксисом
- **TypeScript** — строгая типизация для безопасного кода
- **Webpack 5** — современный бандлер с tree-shaking и правильной оптимизацией
- **Babel** — трансформация современного JavaScript
- **ESLint & Prettier** — контроль качества кода и форматирование
- **React Router DOM v6** — клиентский роутинг
- **Hot Module Replacement (HMR)** — горячая перезагрузка модулей при разработке
- **Path aliases** — удобные алиасы для импортов (@components, @pages, etc.)

## 📦 Структура проекта

```
.
├── public/
│   └── index.html          # HTML шаблон
├── src/
│   ├── api/                # Запросы на сервер
│   ├── components/         # Переиспользуемые компоненты
│   ├── context/            # Обертка проекта для удобного управления состояний
│   ├── declare/            # вспомогательные файлы для удобного импорта
│   ├── hooks/              # Custom React hooks
│   ├── layout/             # Верстка страниц
│   ├── pages/              # Страницы приложения
│   ├── styles/             # Глобальные стили всего приложения(шрифты, цвета, размер)
│   ├── types/              # TypeScript типы
│   ├── utils/              # Вспомогательные функции
│   ├── App.tsx             # Главный компонент с роутингом
│   ├── index.tsx           # Входная точка приложения
├── .babelrc                # Конфигурация Babel
├── .eslintrc.json          # Конфигурация ESLint
├── .prettierrc             # Конфигурация Prettier
├── tsconfig.json           # Конфигурация TypeScript
├── webpack.config.js       # Конфигурация Webpack
├── package.json
└── README.md
```

## 🛠️ Установка

### Требования

- Node.js 16+
- npm или yarn

### Шаги установки

```bash
# Установка зависимостей
npm install

# или с yarn
yarn install
```

## 🎯 Доступные команды

```bash
# Запуск dev сервера (http://localhost:3000)
npm start

# Сборка для production
npm run build

# Проверка кода с ESLint
npm run lint

# Автоматическое исправление ошибок ESLint
npm run lint:fix

# Проверка типов TypeScript
npm run type-check
```

## 📝 Примеры использования

### Создание нового компонента

```typescript
// src/components/Button.tsx
import React from 'react';

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ onClick, children }) => {
  return <button onClick={onClick}>{children}</button>;
};

export default Button;
```

### Использование path alias

```typescript
// Вместо:
import MyComponent from '../../../components/MyComponent';

// Используйте:
import MyComponent from '@components/MyComponent';
```

### Создание страницы с роутингом

```typescript
// src/pages/MyPage.tsx
import React from 'react';

const MyPage: React.FC = () => {
  return <h1>My Page</h1>;
};

export default MyPage;
```

Затем добавьте маршрут в `src/App.tsx`:

```typescript
<Route path="/my-page" element={<MyPage />} />
```

## 🔧 Конфигурация

### TypeScript

Конфигурация находится в `tsconfig.json`. Основные опции:

- `strict: true` — строгая проверка типов
- Path alias для удобных импортов

### ESLint

Конфигурация в `.eslintrc.json` включает:

- Рекомендуемые правила ESLint
- React правила
- React Hooks правила
- TypeScript правила
- Интеграция с Prettier

### Webpack

Конфигурация в `webpack.config.js`:

- Babel loader для TS/TSX/JS
- CSS loader и style loader
- HTML plugin для генерации HTML
- Source maps для разработки

## 🚀 Развертывание

### Build для production

```bash
npm run build
```

Результаты будут в папке `dist/`. Готово к развертыванию на статический хостинг.

### Развертывание на различные платформы

**Vercel:**

```bash
npm i -g vercel
vercel
```

**Netlify:**

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

**GitHub Pages:**
Обновите `webpack.config.js`:

```javascript
output: {
  publicPath: '/repo-name/',
  // ...
}
```
