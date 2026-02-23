# VibeLearn LMS — Детальный план разработки

> **Стек:** Next.js 15 (App Router) · TypeScript · Tailwind CSS + shadcn/ui · PostgreSQL 16 · Prisma · NextAuth.js v5 · Redis (Valkey) · MinIO · OpenRouter · CloudPayments · Dokploy
>
> **Деплой:** Self-hosted VPS (Ubuntu) через Dokploy (Docker-оркестрация)

---

## Фаза 1: Фундамент (Foundation)

### 1.1 Инициализация проекта и инфраструктура

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 1.1.1 | **Создать Next.js 15 проект** | `npx create-next-app@latest` с App Router, TypeScript, Tailwind CSS, ESLint, алиасы путей (`@/`). Настроить `tsconfig.json`, `.eslintrc`, `.prettierrc` | P0 |
| 1.1.2 | **Установить и настроить shadcn/ui** | `npx shadcn-ui@latest init`, добавить базовые компоненты: Button, Input, Card, Dialog, DropdownMenu, Tabs, Badge, Avatar, Tooltip, Sheet, Skeleton | P0 |
| 1.1.3 | **Структура директорий** | Создать каноническую структуру: `src/app/`, `src/components/`, `src/lib/`, `src/hooks/`, `src/types/`, `src/services/`, `src/middleware.ts`, `prisma/` | P0 |
| 1.1.4 | **Docker Compose** | Сервисы: PostgreSQL 16, Redis (Valkey 8), MinIO. Volumes для персистентных данных. `.env.example` со всеми переменными | P0 |
| 1.1.5 | **Dokploy конфигурация** | `Dockerfile` (multi-stage build, node:20-alpine), `dokploy.yml`, настройка Traefik для SSL, health checks | P0 |
| 1.1.6 | **CI/CD pipeline** | GitHub Actions: lint → type-check → test → build → deploy to Dokploy. Отдельные jobs для PR и main branch | P1 |
| 1.1.7 | **Настройка окружения** | `.env.example`, `.env.local` для dev, env-валидация через `@t3-oss/env-nextjs` или `zod` | P0 |

### 1.2 База данных и ORM

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 1.2.1 | **Prisma: инициализация** | `npx prisma init`, настройка `datasource`, `generator`, подключение к PostgreSQL из Docker | P0 |
| 1.2.2 | **Схема: Users** | `id` UUID, `email` unique, `name`, `avatar_url`, `role` enum (STUDENT/INSTRUCTOR/ADMIN), `xp` int, `level` int, `streak_days`, `streak_last_date`, `preferences` Json, timestamps | P0 |
| 1.2.3 | **Схема: Courses** | `id` UUID, `slug` unique, `title`, `description`, `cover_image_url`, `price_rub` int (копейки), `status` enum (DRAFT/PUBLISHED/ARCHIVED), `difficulty` enum, `estimated_hours`, `metadata` Json, timestamps | P0 |
| 1.2.4 | **Схема: Modules** | `id` UUID, FK `course_id`, `title`, `order_index` int, `unlock_condition` Json | P0 |
| 1.2.5 | **Схема: Lessons** | `id` UUID, FK `module_id`, `type` enum (ARTICLE/VIDEO/SANDBOX/QUIZ/INTERACTIVE/MEDIA), `title`, `content` Json, `order_index`, `xp_reward`, `estimated_minutes`, `is_free_preview` bool | P0 |
| 1.2.6 | **Схема: ContentGraph** | `id` UUID, `source_type`/`target_type` enum (COURSE/MODULE/LESSON/PAGE), `source_id`/`target_id` UUID, `relation_type` enum (PREREQUISITE/RECOMMENDED/RELATED/UNLOCKS), `metadata` Json | P0 |
| 1.2.7 | **Схема: UserProgress** | `id` UUID, FK `user_id`, FK `lesson_id`, `status` enum, `score`, `attempts`, `answers_data` Json, `xp_earned`, timestamps | P0 |
| 1.2.8 | **Схема: Enrollments** | FK `user_id`, FK `course_id`, `enrolled_at`, FK `payment_id` optional | P0 |
| 1.2.9 | **Схема: Payments** | `id` UUID, FK `user_id`, `transaction_id` unique (CloudPayments), `amount` int, `currency`, `status` enum, `metadata` Json, timestamps | P0 |
| 1.2.10 | **Схема: Achievements + UserAchievements** | Achievements: `slug` unique, `title`, `description`, `icon_url`, `condition` Json, `xp_bonus`. UserAchievements: связь M2M | P0 |
| 1.2.11 | **Схема: Comments** | FK `user_id`, FK `lesson_id`, `parent_id` self-relation, `content` text, timestamps | P1 |
| 1.2.12 | **Схема: Pages** | `slug` unique, `title`, `blocks` Json, `status` enum, SEO-поля, timestamps | P1 |
| 1.2.13 | **Схема: AiInteractions** | FK `user_id`, FK `lesson_id`, `model`, `tokens_input`/`tokens_output`, `cost_usd`, `request_type`, timestamps | P1 |
| 1.2.14 | **Prisma Seed** | Скрипт `prisma/seed.ts`: тестовый admin-пользователь, 1 демо-курс с модулями и уроками разных типов, achievements | P0 |
| 1.2.15 | **Prisma Client singleton** | `src/lib/prisma.ts` — глобальный singleton для hot reload в dev | P0 |

### 1.3 Аутентификация и авторизация

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 1.3.1 | **NextAuth.js v5 конфигурация** | `src/app/api/auth/[...nextauth]/route.ts`, Prisma Adapter, JWT-стратегия сессий | P0 |
| 1.3.2 | **Email Magic Link провайдер** | Настройка Resend/Nodemailer как email-транспорта, кастомные шаблоны письма | P0 |
| 1.3.3 | **Google OAuth провайдер** | Регистрация OAuth-приложения, callback URL, маппинг профиля | P0 |
| 1.3.4 | **RBAC middleware** | `src/middleware.ts`: проверка роли для `/admin/*` маршрутов. Хелпер `withAuth(role)` для API routes | P0 |
| 1.3.5 | **Страницы авторизации** | `/auth/signin` (форма email + кнопка Google), `/auth/verify-request` (проверь почту), `/auth/error` | P0 |
| 1.3.6 | **Хук useSession и провайдер** | `SessionProvider` в root layout, `useSession()`, серверная функция `getServerSession()` | P0 |

### 1.4 Базовый UI каркас

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 1.4.1 | **Root Layout** | `src/app/layout.tsx`: шрифты (Inter/Geist), metadata, ThemeProvider (dark mode), SessionProvider, Toaster | P0 |
| 1.4.2 | **Публичный лейаут** | `src/app/(public)/layout.tsx`: Header (logo, nav, auth-кнопки), Footer. Адаптивный на мобильных | P0 |
| 1.4.3 | **Admin лейаут** | `src/app/admin/layout.tsx`: Sidebar (nav: Dashboard, Courses, Pages, Graph, Users, AI Settings), Header с user-меню | P0 |
| 1.4.4 | **Student лейаут (Dashboard)** | `src/app/(student)/layout.tsx`: минималистичный header, боковая панель с прогрессом | P0 |
| 1.4.5 | **Lesson лейаут** | `src/app/(student)/courses/[slug]/lessons/[id]/layout.tsx`: сайдбар с оглавлением модуля, галочки выполнения, основная область max-width 720px | P0 |
| 1.4.6 | **Тема и токены дизайна** | Настройка цветовых переменных CSS, dark/light mode через `next-themes`, типографика | P0 |
| 1.4.7 | **Компонент Loading/Error** | `loading.tsx` и `error.tsx` для каждой route group с Skeleton-компонентами | P1 |

---

## Фаза 2: Ядро (Core Features)

### 2.1 Admin: Управление курсами (CRUD)

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 2.1.1 | **API: CRUD курсов** | `src/app/api/admin/courses/route.ts` (GET list, POST create), `.../[id]/route.ts` (GET, PATCH, DELETE). Валидация через Zod, RBAC | P0 |
| 2.1.2 | **API: CRUD модулей** | Вложены в курс. Reorder (PATCH `order_index`). Каскадное удаление | P0 |
| 2.1.3 | **API: CRUD уроков** | Вложены в модуль. Каждый тип хранит свой JSON в `content`. Reorder | P0 |
| 2.1.4 | **Страница: список курсов** | `/admin/courses` — таблица с фильтрами (статус, сложность), поиском, пагинацией. Кнопки: создать, редактировать, архивировать | P0 |
| 2.1.5 | **Страница: редактор курса (Outline)** | `/admin/courses/[id]` — заголовок + описание + обложка. Список модулей с drag-and-drop (dnd-kit). Внутри каждого модуля — список уроков с drag-and-drop. Быстрое создание урока с выбором типа | P0 |
| 2.1.6 | **Компонент: загрузка обложки** | Drag-and-drop zone → upload в MinIO → сохранение URL. Превью изображения | P0 |
| 2.1.7 | **Утилита MinIO client** | `src/lib/minio.ts` — подключение, presigned URLs, upload/delete хелперы | P0 |

### 2.2 Редактор контента: Article (Tiptap)

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 2.2.1 | **Установить Tiptap** | `@tiptap/react`, `@tiptap/starter-kit`, расширения: Image, CodeBlockLowlight, Table, Link, Placeholder, Typography | P0 |
| 2.2.2 | **Компонент: ArticleEditor** | WYSIWYG-редактор с toolbar. Блоки: H1-H3, параграф, списки, цитата, разделитель, код с подсветкой (Shiki), изображения, таблицы | P0 |
| 2.2.3 | **Расширение: Callout** | Кастомный блок callout (info, warning, tip) с иконкой и цветом | P0 |
| 2.2.4 | **Расширение: Spoiler** | Разворачиваемый блок-спойлер | P1 |
| 2.2.5 | **Расширение: Embed** | Вставка YouTube, Figma, CodePen, Loom через URL → iframe | P1 |
| 2.2.6 | **Upload изображений** | Drag-and-drop / paste → upload в MinIO → вставка в редактор | P0 |
| 2.2.7 | **Сериализация** | Сохранение JSON в `lessons.content`, загрузка и рендеринг | P0 |
| 2.2.8 | **Компонент: ArticleRenderer** | Read-only рендер Tiptap JSON для student view. Стилизация прозой (prose class) | P0 |

### 2.3 Каталог курсов (Student)

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 2.3.1 | **API: публичный список курсов** | `GET /api/courses` — только published, пагинация, фильтры (difficulty, free/paid), сортировка | P0 |
| 2.3.2 | **API: детали курса** | `GET /api/courses/[slug]` — курс с модулями и уроками (без content). Проверка enrollment для платных | P0 |
| 2.3.3 | **API: контент урока** | `GET /api/courses/[slug]/lessons/[id]` — полный content. Auth required, проверка доступа (enrollment или free preview) | P0 |
| 2.3.4 | **Страница: каталог** | `/courses` — карточки курсов (обложка, название, описание, сложность, длительность, цена). Фильтры и поиск | P0 |
| 2.3.5 | **Страница: курс** | `/courses/[slug]` — лендинг курса: описание, программа (модули/уроки), кнопка «Начать» или «Купить» | P0 |
| 2.3.6 | **Страница: урок** | `/courses/[slug]/lessons/[id]` — рендеринг контента по типу (article → ArticleRenderer). Навигация пред/след, сайдбар | P0 |

### 2.4 Прогресс и XP

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 2.4.1 | **API: отметка завершения** | `POST /api/progress/[lessonId]/complete` — создать/обновить UserProgress, начислить XP, пересчитать level | P0 |
| 2.4.2 | **API: мой прогресс** | `GET /api/me/progress` — общий прогресс: XP, level, streak, прогресс по каждому курсу (% завершения) | P0 |
| 2.4.3 | **Сервис: XP Engine** | `src/services/xp.ts` — начисление XP, расчёт уровня по таблице, бонус за streak, бонус за quiz 100%, бонус за sandbox > 80 | P0 |
| 2.4.4 | **Сервис: Streak Engine** | `src/services/streak.ts` — обновление streak_days при ежедневной активности, сброс при пропуске, заморозки | P0 |
| 2.4.5 | **Компонент: ProgressBar** | Прогресс-бар по курсу (% пройденных уроков) для dashboard и страницы курса | P0 |
| 2.4.6 | **Компонент: XP/Level display** | Аватар + уровень + XP бар до следующего уровня + streak flame. Используется в header и dashboard | P0 |
| 2.4.7 | **Компонент: LevelUpModal** | Анимированный модал при достижении нового уровня | P1 |
| 2.4.8 | **Student Dashboard** | `/dashboard` — активные курсы с прогрессом, текущий streak, уровень, последний урок «Продолжить», достижения | P0 |

### 2.5 Квиз (Quiz)

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 2.5.1 | **Компонент: QuizBuilder (Admin)** | Визуальный конструктор вопросов. Типы: single choice, multiple choice, true/false, free text. Drag-and-drop порядок. Пояснение к ответу. Pass threshold, shuffle, time limit | P0 |
| 2.5.2 | **Компонент: QuizPlayer (Student)** | Рендер вопросов, выбор ответов, таймер (опционально), отправка, показ результатов с объяснениями | P0 |
| 2.5.3 | **API: отправка квиза** | `POST /api/progress/[lessonId]/quiz` — принять ответы, проверить, посчитать score, сохранить в UserProgress | P0 |
| 2.5.4 | **AI-проверка free text** | Для вопросов типа free text — отправка в OpenRouter (claude-haiku) для семантической оценки. Серверная логика | P1 |
| 2.5.5 | **Компонент: QuizResults** | Экран результатов: общий балл, разбор каждого вопроса (правильно/неправильно + объяснение), XP earned | P0 |

---

## Фаза 3: AI-интеграция и песочницы

### 3.1 OpenRouter интеграция

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 3.1.1 | **Сервис: OpenRouter client** | `src/services/openrouter.ts` — обёртка над OpenRouter API. Streaming (SSE), error handling, retry, model selection | P0 |
| 3.1.2 | **API: AI completion proxy** | `POST /api/ai/completion` — auth, rate limiting (Redis), добавление system prompt, проксирование в OpenRouter, streaming response, логирование в ai_interactions | P0 |
| 3.1.3 | **API: AI evaluation** | `POST /api/ai/evaluate` — принять ответ ученика + эталон + критерии → AI-судья выставляет оценку 0-100 с объяснением | P0 |
| 3.1.4 | **Rate Limiter** | `src/lib/rate-limiter.ts` — Redis-based. Лимиты: на пользователя/день, на пользователя/урок, глобальный. Настраиваемые через admin | P0 |
| 3.1.5 | **Cost Tracker** | `src/services/ai-cost.ts` — подсчёт стоимости токенов по модели, запись в ai_interactions, проверка бюджетных лимитов, алерты | P0 |
| 3.1.6 | **Кэширование** | Redis-кэш для идентичных evaluation-промптов (TTL 1h). Ключ = hash(system_prompt + user_input + model) | P1 |

### 3.2 Prompt Playground (Песочница промптов)

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 3.2.1 | **Компонент: PromptPlayground** | Split view. Левая панель: описание задания + критерии оценки. Правая: текстовое поле для промпта + кнопка «Отправить» + выбор модели. Нижняя: streaming-ответ AI | P0 |
| 3.2.2 | **Admin: редактор задания** | Форма: описание задания, evaluation_criteria, reference_solution, model_whitelist, max_attempts, hints[] | P0 |
| 3.2.3 | **Оценка результата** | После генерации → кнопка «Оценить» → AI-судья сравнивает с эталоном → оценка 0-100 + фидбек | P0 |
| 3.2.4 | **Попытки и история** | Показать кол-во оставшихся попыток. История попыток с оценками | P0 |
| 3.2.5 | **Hints (подсказки)** | Кнопка «Подсказка» — последовательно раскрывает hint[0], hint[1], ... из настроек урока | P1 |

### 3.3 Code Sandbox (Песочница кода)

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 3.3.1 | **Установить Monaco Editor** | `@monaco-editor/react`, настройка тем, языков (HTML, CSS, JS, JSX/TSX) | P1 |
| 3.3.2 | **Компонент: CodeSandbox** | Split view на всю ширину. Слева: Monaco Editor с вкладками (файлы). Справа: live preview в iframe (sandbox). Снизу: описание задания | P1 |
| 3.3.3 | **iframe sandbox** | Безопасный iframe с `sandbox` атрибутом. Инжекция пользовательского кода. Обработка ошибок | P1 |
| 3.3.4 | **Admin: starter code + tests** | Редактор начального кода (шаблон), reference solution, опциональные тесты (Jest-like assertions) | P1 |
| 3.3.5 | **AI-помощник** | Кнопка «Попросить подсказку» → отправка контекста задания + текущий код в AI (claude-haiku) → хинт без прямого решения | P1 |
| 3.3.6 | **Проверка решения** | Запуск тестов в iframe, сравнение с reference, AI-оценка → score 0-100 | P1 |
| 3.3.7 | **Mobile fallback** | Заглушка «Откройте на десктопе» для Code Sandbox на мобильных. Prompt Playground работает на мобильных | P1 |

---

## Фаза 4: Платежи и Контент

### 4.1 CloudPayments интеграция

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 4.1.1 | **Сервис: CloudPayments client** | `src/services/cloudpayments.ts` — генерация данных для Widget, HMAC-верификация webhook'ов | P0 |
| 4.1.2 | **API: создание заказа** | `POST /api/payments/create-order` — создать запись Payment (status=pending), вернуть данные для Widget | P0 |
| 4.1.3 | **API: webhook confirm** | `POST /api/payments/confirm` — HMAC-проверка, обновить Payment status=success, создать Enrollment, вернуть `{code: 0}`. Idempotency по TransactionId | P0 |
| 4.1.4 | **API: webhook fail** | `POST /api/payments/fail` — обновить Payment status=failed | P0 |
| 4.1.5 | **API: webhook refund** | `POST /api/payments/refund` — отозвать Enrollment, обновить Payment status=refunded | P0 |
| 4.1.6 | **Компонент: PaymentButton** | Кнопка «Купить курс» → CloudPayments Widget (checkout popup). Callback на успех: redirect в курс | P0 |
| 4.1.7 | **Промокоды** | Таблица `promo_codes` (code, discount_percent/discount_amount, max_uses, valid_until). Применение при оплате | P1 |
| 4.1.8 | **Страница: история оплат** | `/admin/payments` — таблица транзакций с фильтрами (статус, период, пользователь) | P1 |

### 4.2 Видео-контент

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 4.2.1 | **Компонент: VideoPlayer** | Плеер на базе video.js или Plyr. HLS поддержка, chapters (таймкоды), субтитры VTT, трекинг просмотра (>= 90% = завершён) | P1 |
| 4.2.2 | **Admin: загрузка видео** | Upload видео в MinIO (chunked upload для больших файлов). Thumbnail генерация. Редактор chapters + VTT | P1 |
| 4.2.3 | **API: video streaming** | Presigned URL из MinIO для стриминга. Range-requests для seek | P1 |

### 4.3 Интерактивные упражнения

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 4.3.1 | **Компонент: StepByStepGuide** | Пошаговый гайд с проверкой каждого шага. Чекбоксы/кнопки продвижения | P2 |
| 4.3.2 | **Компонент: FillInTheBlank** | Заполнение пропусков в коде/промптах. Проверка ответа | P2 |
| 4.3.3 | **Компонент: BeforeAfterSlider** | Слайдер сравнения промптов/результатов (before/after) | P2 |
| 4.3.4 | **Компонент: HotspotExercise** | Найди ошибку в коде/промпте кликом на проблемное место | P2 |

---

## Фаза 5: Admin Power Features

### 5.1 Graph Editor

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 5.1.1 | **Установить React Flow** | `@xyflow/react`, настройка, кастомные ноды и рёбра | P0 |
| 5.1.2 | **API: CRUD связей** | `GET/POST/PATCH/DELETE /api/admin/graph/*` — управление ContentGraph записями | P0 |
| 5.1.3 | **API: граф данные** | `GET /api/admin/graph` — все ноды (courses, modules, lessons, pages) и рёбра (content_graph) для визуализации | P0 |
| 5.1.4 | **Компонент: GraphEditor** | Полноэкранный React Flow canvas. Ноды = карточки (название, тип, статус, цвет по типу). Рёбра = связи с разными стилями (сплошная/пунктир/точки) | P0 |
| 5.1.5 | **Кастомные ноды** | Типы: CourseNode (синий), ModuleNode (зелёный), LessonNode (жёлтый), PageNode (серый). Мини-превью, статус badge | P0 |
| 5.1.6 | **Соединение нод** | Drag-and-drop соединение → диалог выбора типа связи (prerequisite/recommended/related/unlocks) | P0 |
| 5.1.7 | **Minimap и навигация** | React Flow Minimap, controls (zoom, fit), фильтрация по типу нод, поиск | P0 |
| 5.1.8 | **Auto-layout** | Dagre layout для автоматического расположения нод. Кнопка «Упорядочить» | P1 |
| 5.1.9 | **Валидация графа** | Обнаружение циклов в пререквизитах, предупреждения о недоступных нодах (сиротах) | P1 |
| 5.1.10 | **Двойной клик** | Двойной клик по ноде → переход в редактор этого элемента | P0 |

### 5.2 Page Editor

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 5.2.1 | **API: CRUD страниц** | `GET/POST/PATCH/DELETE /api/admin/pages/*`. Поля: slug, title, blocks (JSON), status, SEO-поля | P1 |
| 5.2.2 | **Страница: редактор** | `/admin/pages/[id]` — Tiptap-редактор (тот же что для article), SEO-настройки (title, description, OG-image), управление slug | P1 |
| 5.2.3 | **Публичный рендеринг** | `/[slug]` — catch-all для страниц. ISR/SSG. SEO meta tags | P1 |

### 5.3 User Management

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 5.3.1 | **API: CRUD пользователей** | `GET /api/admin/users` (list, search, filter by role), `GET /api/admin/users/[id]`, `PATCH` (role, ban), `POST` bulk actions | P0 |
| 5.3.2 | **Страница: список пользователей** | `/admin/users` — таблица с поиском, фильтрами (роль, дата регистрации), пагинацией | P0 |
| 5.3.3 | **Страница: профиль ученика** | `/admin/users/[id]` — прогресс по курсам, XP, бейджи, история оплат, enrollments. Действия: сменить роль, выдать доступ, бан | P0 |
| 5.3.4 | **Bulk actions** | Множественный выбор → массовое действие (выдать доступ, сменить роль, экспорт CSV) | P1 |

### 5.4 Admin Dashboard (Аналитика)

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 5.4.1 | **API: аналитика** | `GET /api/admin/analytics/*` — метрики: DAU/WAU/MAU, доход, completion rates, AI usage/cost | P1 |
| 5.4.2 | **Страница: Dashboard** | `/admin` — карточки с ключевыми метриками, графики (recharts/nivo), completion funnel, AI cost tracker, последние комментарии | P1 |
| 5.4.3 | **AI Usage dashboard** | Токены за период, стоимость по моделям, топ-пользователи по потреблению, бюджет vs фактические расходы | P1 |

### 5.5 AI Settings (Admin)

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 5.5.1 | **Страница: AI настройки** | `/admin/settings/ai` — выбор доступных моделей, глобальный system prompt, rate limits, бюджетные лимиты, evaluation prompt templates | P1 |
| 5.5.2 | **Модель: Settings (KV)** | Таблица `settings` (key-value) или JSON-конфигурация для хранения AI-настроек. Кэш в Redis | P1 |

---

## Фаза 6: Геймификация и Сообщество

### 6.1 Достижения (Achievements)

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 6.1.1 | **Сервис: Achievement Engine** | `src/services/achievements.ts` — проверка условий после каждого действия (complete lesson, quiz score, streak update). Условия в JSON: `{ type: "lessons_completed", count: 10 }` | P1 |
| 6.1.2 | **Компонент: AchievementToast** | Анимированный toast/notification при получении нового достижения | P1 |
| 6.1.3 | **Компонент: BadgeGrid** | Сетка бейджей (полученные + заблокированные с прогрессом) для профиля и dashboard | P1 |
| 6.1.4 | **Seed: базовые достижения** | Первый промпт, Квиз-мастер, Недельный воин, Месячный марафон, Первый курс, Промпт-инженер, Комментатор | P1 |

### 6.2 Стрики (визуализация)

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 6.2.1 | **Компонент: StreakDisplay** | Анимация огня (CSS/Lottie), число дней. Рост анимации с длиной streak | P1 |
| 6.2.2 | **Компонент: StreakCalendar** | Мини-календарь активности (как GitHub contribution graph) | P2 |
| 6.2.3 | **Freeze механика** | 1 бесплатная заморозка/неделю. Покупка доп. заморозок за XP. API + UI | P2 |

### 6.3 Комментарии

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 6.3.1 | **API: CRUD комментариев** | `POST/GET/DELETE /api/comments` — создание (с parent_id для ответов), получение (tree), удаление (автор или admin) | P1 |
| 6.3.2 | **Компонент: CommentSection** | Древовидные комментарии (1 уровень вложенности) под уроком. Markdown в комментариях. Кнопка «Полезно» | P1 |
| 6.3.3 | **Модерация** | Кнопка «Пожаловаться», удаление админом, auto-flag по ключевым словам | P2 |

### 6.4 Публичные профили

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 6.4.1 | **Страница: профиль** | `/profile/[id]` — аватар, имя, уровень, бейджи, прогресс (опционально скрываемый), streak | P2 |
| 6.4.2 | **Настройки приватности** | Переключатели: показывать/скрывать прогресс, участвовать в leaderboard | P2 |

---

## Фаза 7: Онбординг, Landing и UX Polish

### 7.1 Landing Page

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 7.1.1 | **Страница: Landing** | `/` — Hero секция (заголовок + CTA), описание подхода, каталог курсов, социальное доказательство, отзывы, FAQ | P0 |
| 7.1.2 | **SEO** | Metadata, Open Graph, structured data (Course schema), sitemap.xml, robots.txt | P1 |

### 7.2 Онбординг

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 7.2.1 | **Flow: онбординг** | 3-4 экрана после первой регистрации: цель обучения, текущий опыт, выбор первого курса → redirect на dashboard | P1 |
| 7.2.2 | **Компонент: OnboardingWizard** | Мульти-шаговая форма с прогресс-баром, сохранение ответов в `users.preferences` | P1 |

### 7.3 Mobile Responsive

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 7.3.1 | **Адаптивный header/nav** | Hamburger-меню на мобильных, slide-out navigation | P0 |
| 7.3.2 | **Адаптивные карточки курсов** | Grid → single column на мобильных | P0 |
| 7.3.3 | **Адаптивный лейаут уроков** | Сайдбар → bottom sheet или collapsible на мобильных | P0 |
| 7.3.4 | **Адаптивный admin** | Sidebar → drawer на мобильных, таблицы → карточки | P1 |

### 7.4 Уведомления

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 7.4.1 | **Email: уведомления** | Resend или Nodemailer. Шаблоны: welcome, streak reminder, course completion, new achievement | P1 |
| 7.4.2 | **In-app notifications** | Таблица `notifications`. Bell icon в header. Отметка прочитанного. SSE/polling для real-time | P2 |

---

## Фаза 8: Качество и Запуск

### 8.1 Тестирование

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 8.1.1 | **Unit-тесты** | Vitest для сервисов (XP engine, streak engine, rate limiter, HMAC verification). Покрытие критической бизнес-логики | P1 |
| 8.1.2 | **API integration тесты** | Тесты для ключевых API routes с тестовой БД | P1 |
| 8.1.3 | **E2E тесты (Playwright)** | Критичные пути: регистрация → логин → покупка курса → прохождение урока → quiz → sandbox → completion | P1 |
| 8.1.4 | **Component тесты** | Testing Library для сложных компонентов: QuizPlayer, PromptPlayground, CodeSandbox | P2 |

### 8.2 Производительность

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 8.2.1 | **ISR/SSG** | Статическая генерация для каталога курсов, landing, страниц. ISR с revalidation для динамических данных | P1 |
| 8.2.2 | **Lazy loading** | Динамический импорт тяжёлых компонентов: Monaco Editor, React Flow, Tiptap, Video Player | P1 |
| 8.2.3 | **Image optimization** | `next/image` для всех изображений. WebP/AVIF. Размеры и placeholder blur | P1 |
| 8.2.4 | **Redis кэширование** | Кэш курсов, пользовательских профилей, графа связей. Invalidation при обновлении | P1 |
| 8.2.5 | **Bundle analysis** | `@next/bundle-analyzer` — анализ и оптимизация бандла | P2 |

### 8.3 Мониторинг и безопасность

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 8.3.1 | **Sentry** | Error tracking для клиента и сервера. Source maps. Performance monitoring | P1 |
| 8.3.2 | **Логирование** | Structured logging (pino/winston) для API routes, AI-запросов, платежей | P1 |
| 8.3.3 | **Health checks** | `/api/health` — проверка PostgreSQL, Redis, MinIO. Используется Docker health check | P0 |
| 8.3.4 | **Backup strategy** | Cron-job: `pg_dump` → MinIO/external S3. Ежедневный бэкап с ротацией (7 дней) | P0 |
| 8.3.5 | **Security audit** | CSRF-токены, rate limiting на auth, DOMPurify для UGC, проверка OWASP top 10 | P0 |

### 8.4 Запуск

| # | Задача | Детали | Приоритет |
|---|--------|--------|-----------|
| 8.4.1 | **Staging deploy** | Развернуть на staging VPS через Dokploy. Smoke тесты | P0 |
| 8.4.2 | **Production deploy** | Финальный деплой: DNS, SSL, env variables, миграции | P0 |
| 8.4.3 | **Seed production data** | Admin-аккаунт, начальный курс, достижения, landing page | P0 |
| 8.4.4 | **Soft launch** | Закрытая бета: 10-20 пользователей, сбор фидбека | P0 |
| 8.4.5 | **Public launch** | Открытие регистрации, маркетинг | P0 |

---

## Граф зависимостей (критический путь)

```
1.1 Инфра → 1.2 БД → 1.3 Auth → 1.4 UI каркас
                                      ↓
                         ┌─────────────┼──────────────┐
                         ↓             ↓              ↓
                    2.1 CRUD     2.2 Tiptap     2.3 Каталог
                    курсов       редактор       (student)
                         ↓             ↓              ↓
                         └─────────────┼──────────────┘
                                       ↓
                              2.4 Прогресс + XP
                              2.5 Квизы
                                       ↓
                         ┌─────────────┼──────────────┐
                         ↓             ↓              ↓
                   3.1 OpenRouter  4.1 Payments  5.1 Graph
                   3.2 Prompt SB                  Editor
                   3.3 Code SB
                         ↓             ↓              ↓
                         └─────────────┼──────────────┘
                                       ↓
                              6.x Геймификация
                              7.x UX Polish
                                       ↓
                              8.x Тесты + Запуск
```

---

## Сводка по количеству задач

| Фаза | Название | Задач | P0 | P1 | P2 |
|-------|----------|-------|----|----|----|
| 1 | Фундамент | 33 | 27 | 5 | 1 |
| 2 | Ядро | 28 | 23 | 4 | 1 |
| 3 | AI и Песочницы | 13 | 7 | 6 | 0 |
| 4 | Платежи и Контент | 15 | 6 | 6 | 3 |
| 5 | Admin Power | 17 | 8 | 9 | 0 |
| 6 | Геймификация | 12 | 0 | 7 | 5 |
| 7 | UX Polish | 10 | 4 | 4 | 2 |
| 8 | Качество и Запуск | 14 | 5 | 7 | 2 |
| **Итого** | | **142** | **80** | **48** | **14** |

---

## Ключевые файлы и структура проекта

```
vibe-codex-lms/
├── .github/workflows/         # CI/CD
├── docker-compose.yml         # PostgreSQL + Redis + MinIO
├── Dockerfile                 # Multi-stage build
├── dokploy.yml               # Dokploy config
├── prisma/
│   ├── schema.prisma         # Все модели данных
│   └── seed.ts               # Seed скрипт
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Landing page
│   │   ├── (public)/         # Каталог, лендинги курсов
│   │   │   ├── courses/
│   │   │   └── [slug]/       # Динамические страницы
│   │   ├── (student)/        # Authenticated student area
│   │   │   ├── dashboard/
│   │   │   ├── courses/[slug]/lessons/[id]/
│   │   │   └── profile/
│   │   ├── admin/            # Admin panel
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx      # Dashboard
│   │   │   ├── courses/
│   │   │   ├── pages/
│   │   │   ├── graph/
│   │   │   ├── users/
│   │   │   └── settings/
│   │   ├── auth/             # Auth pages
│   │   └── api/              # API Routes
│   │       ├── auth/[...nextauth]/
│   │       ├── courses/
│   │       ├── progress/
│   │       ├── ai/
│   │       ├── payments/
│   │       ├── comments/
│   │       └── admin/
│   ├── components/
│   │   ├── ui/               # shadcn/ui
│   │   ├── editor/           # Tiptap editor + renderer
│   │   ├── sandbox/          # Prompt + Code sandboxes
│   │   ├── quiz/             # Quiz builder + player
│   │   ├── graph/            # React Flow graph editor
│   │   ├── video/            # Video player
│   │   ├── gamification/     # XP, streak, badges
│   │   └── layout/           # Header, Footer, Sidebar
│   ├── hooks/                # Custom React hooks
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── minio.ts          # MinIO client
│   │   ├── redis.ts          # Redis client
│   │   ├── rate-limiter.ts   # Rate limiting
│   │   ├── auth.ts           # Auth helpers
│   │   └── utils.ts          # General utilities
│   ├── services/
│   │   ├── openrouter.ts     # OpenRouter API client
│   │   ├── cloudpayments.ts  # CloudPayments integration
│   │   ├── xp.ts             # XP calculation engine
│   │   ├── streak.ts         # Streak engine
│   │   ├── achievements.ts   # Achievement engine
│   │   └── ai-cost.ts        # AI cost tracking
│   ├── types/                # TypeScript types
│   └── middleware.ts         # Auth + RBAC middleware
├── public/                   # Static assets
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── package.json
```
