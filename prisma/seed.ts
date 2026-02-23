import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@vibelearn.ru" },
    update: {},
    create: {
      email: "admin@vibelearn.ru",
      name: "Admin",
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  console.log("Created admin:", admin.email);

  // Create demo course
  const course = await prisma.course.upsert({
    where: { slug: "vibe-coding-basics" },
    update: {},
    create: {
      slug: "vibe-coding-basics",
      title: "Основы вайб-кодинга",
      description:
        "Научитесь создавать цифровые продукты с помощью AI-инструментов. Курс для начинающих — никаких технических знаний не требуется.",
      status: "PUBLISHED",
      difficulty: "BEGINNER",
      priceRub: 0,
      estimatedHours: 8,
    },
  });

  // Module 1
  const module1 = await prisma.module.upsert({
    where: { id: "mod-1-intro" },
    update: {},
    create: {
      id: "mod-1-intro",
      courseId: course.id,
      title: "Введение в вайб-кодинг",
      orderIndex: 0,
    },
  });

  await prisma.lesson.upsert({
    where: { id: "lesson-1-1" },
    update: {},
    create: {
      id: "lesson-1-1",
      moduleId: module1.id,
      type: "ARTICLE",
      title: "Что такое вайб-кодинг?",
      content: {
        html: `<h1>Что такое вайб-кодинг?</h1>
<p>Вайб-кодинг — это подход к созданию цифровых продуктов, при котором вы описываете желаемый результат на естественном языке, а AI генерирует код, дизайн или контент.</p>
<h2>Ключевые принципы</h2>
<ul>
<li><strong>Промпт-инжиниринг</strong> — умение правильно формулировать запросы к AI</li>
<li><strong>Итеративный подход</strong> — улучшение результата через серию уточнений</li>
<li><strong>Контекст-менеджмент</strong> — управление контекстом для получения лучших результатов</li>
</ul>
<h2>Для кого этот курс?</h2>
<p>Курс подходит для:</p>
<ul>
<li>Дизайнеров, которые хотят прототипировать быстрее</li>
<li>Маркетологов, создающих лендинги и контент</li>
<li>Продакт-менеджеров, автоматизирующих рутину</li>
<li>Всех, кто хочет создавать цифровые продукты</li>
</ul>`,
      },
      orderIndex: 0,
      xpReward: 10,
      estimatedMinutes: 5,
      isFreePreview: true,
    },
  });

  await prisma.lesson.upsert({
    where: { id: "lesson-1-2" },
    update: {},
    create: {
      id: "lesson-1-2",
      moduleId: module1.id,
      type: "QUIZ",
      title: "Проверка: Основы вайб-кодинга",
      content: {
        questions: [
          {
            id: "q1",
            type: "single_choice",
            text: "Что является ключевым навыком в вайб-кодинге?",
            options: [
              { id: "a", text: "Знание C++" },
              { id: "b", text: "Промпт-инжиниринг" },
              { id: "c", text: "Дизайн баз данных" },
              { id: "d", text: "Машинное обучение" },
            ],
            correct: "b",
            explanation: "Промпт-инжиниринг — это основа вайб-кодинга, умение правильно формулировать запросы к AI.",
            points: 10,
          },
          {
            id: "q2",
            type: "true_false",
            text: "Для вайб-кодинга обязательно нужно знать программирование",
            options: [
              { id: "true", text: "Верно" },
              { id: "false", text: "Неверно" },
            ],
            correct: "false",
            explanation: "Вайб-кодинг позволяет создавать продукты без глубоких знаний программирования, используя AI как инструмент.",
            points: 10,
          },
        ],
        pass_threshold: 70,
        shuffle: false,
      },
      orderIndex: 1,
      xpReward: 15,
      estimatedMinutes: 5,
    },
  });

  // Module 2
  const module2 = await prisma.module.upsert({
    where: { id: "mod-2-prompts" },
    update: {},
    create: {
      id: "mod-2-prompts",
      courseId: course.id,
      title: "Промпт-инжиниринг",
      orderIndex: 1,
    },
  });

  await prisma.lesson.upsert({
    where: { id: "lesson-2-1" },
    update: {},
    create: {
      id: "lesson-2-1",
      moduleId: module2.id,
      type: "ARTICLE",
      title: "Анатомия хорошего промпта",
      content: {
        html: `<h1>Анатомия хорошего промпта</h1>
<p>Хороший промпт содержит несколько ключевых элементов:</p>
<h2>1. Роль</h2>
<p>Определите, кем является AI: «Ты — опытный UX-дизайнер с 10-летним стажем»</p>
<h2>2. Задача</h2>
<p>Чётко опишите, что нужно сделать: «Создай wireframe для мобильного приложения доставки еды»</p>
<h2>3. Контекст</h2>
<p>Дайте необходимый фон: «Целевая аудитория — работающие профессионалы 25-40 лет»</p>
<h2>4. Формат</h2>
<p>Укажите желаемый формат ответа: «Представь результат в виде маркдаун-списка с описанием каждого экрана»</p>
<h2>5. Ограничения</h2>
<p>Задайте рамки: «Не более 5 экранов, минималистичный стиль»</p>`,
      },
      orderIndex: 0,
      xpReward: 10,
      estimatedMinutes: 8,
    },
  });

  await prisma.lesson.upsert({
    where: { id: "lesson-2-2" },
    update: {},
    create: {
      id: "lesson-2-2",
      moduleId: module2.id,
      type: "SANDBOX",
      title: "Практика: Напиши свой первый промпт",
      content: {
        sandbox_type: "prompt",
        task_description:
          "Напишите промпт для AI, который создаст описание лендинга для онлайн-школы йоги. Промпт должен включать роль, задачу, контекст, формат и ограничения.",
        reference_solution:
          "Ты — копирайтер с опытом в wellness-индустрии. Создай текст для лендинга онлайн-школы йоги для начинающих. ЦА: женщины 25-45 лет, живущие в крупных городах, работающие в офисе. Формат: заголовок, 3 блока с преимуществами, CTA-блок. Ограничения: не более 500 слов, тёплый и приглашающий тон.",
        evaluation_criteria:
          "Промпт должен содержать: 1) роль для AI, 2) чёткую задачу, 3) описание ЦА, 4) желаемый формат, 5) ограничения. Оценивается полнота, ясность и структурированность.",
        hints: [
          "Начните с определения роли для AI — кем он должен быть?",
          "Подумайте, кто целевая аудитория школы йоги",
          "Укажите, в каком формате вы хотите получить ответ",
        ],
        max_attempts: 5,
      },
      orderIndex: 1,
      xpReward: 25,
      estimatedMinutes: 15,
    },
  });

  // Achievements
  const achievements = [
    {
      slug: "first-sandbox",
      title: "Первый промпт",
      description: "Выполнить первое задание в песочнице",
      condition: { type: "first_sandbox" },
      xpBonus: 25,
    },
    {
      slug: "quiz-master-5",
      title: "Знаток",
      description: "Набрать 100% в 5 квизах",
      condition: { type: "quiz_perfect", count: 5 },
      xpBonus: 50,
    },
    {
      slug: "streak-7",
      title: "Неделя подряд",
      description: "Учиться 7 дней подряд",
      condition: { type: "streak_days", count: 7 },
      xpBonus: 50,
    },
    {
      slug: "streak-30",
      title: "Марафонец",
      description: "Учиться 30 дней подряд",
      condition: { type: "streak_days", count: 30 },
      xpBonus: 200,
    },
    {
      slug: "course-complete",
      title: "Выпускник",
      description: "Пройти курс полностью",
      condition: { type: "course_complete" },
      xpBonus: 100,
    },
    {
      slug: "sandbox-pro",
      title: "Промпт-мастер",
      description: "Получить 80+ баллов в 20 песочницах",
      condition: { type: "sandbox_high_score", count: 20, threshold: 80 },
      xpBonus: 100,
    },
    {
      slug: "commentator",
      title: "Активный участник",
      description: "Написать 10 комментариев",
      condition: { type: "comments_count", count: 10 },
      xpBonus: 30,
    },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { slug: a.slug },
      update: {},
      create: a,
    });
  }

  // Paid course
  await prisma.course.upsert({
    where: { slug: "advanced-ai-product" },
    update: {},
    create: {
      slug: "advanced-ai-product",
      title: "AI-продукт: от идеи до MVP",
      description:
        "Продвинутый курс по созданию полноценного цифрового продукта с использованием AI. Научитесь проектировать архитектуру, писать промпты для сложных задач и запускать MVP.",
      status: "PUBLISHED",
      difficulty: "ADVANCED",
      priceRub: 499000, // 4990 руб
      estimatedHours: 20,
    },
  });

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
