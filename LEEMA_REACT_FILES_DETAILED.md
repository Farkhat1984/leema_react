# Детальный анализ всех файлов LEEMA_REACT

## Конфигурационные файлы (корень проекта)

### package.json
- **Назначение**: Зависимости и скрипты проекта
- **Ключевые зависимости**:
  - React 19.1.1 + React DOM
  - React Router 7.9.5
  - Zustand 5.0.8 (state management)
  - TanStack Query 5.90.5 (data fetching)
  - Axios 1.13.1
  - React Hook Form + Zod (формы и валидация)
  - Recharts (графики)
  - Tailwind CSS 4.1.16

### vite.config.ts
- **Назначение**: Конфигурация сборщика Vite
- **Функции**: hot reload, оптимизация, code splitting

### tsconfig.json
- **Назначение**: Конфигурация TypeScript
- **Важно**: path aliases (`@/` → `src/`)

### tailwind.config.js
- **Назначение**: Конфигурация Tailwind CSS
- **Настройки**: темы, цвета, расширения

### .env / .env.example
- **Назначение**: Переменные окружения
- **Содержит**: API URLs, ключи, конфигурация

---

## Entry Points

### src/main.tsx
```typescript
Инициализация приложения:
- Настройка QueryClient (TanStack Query)
- Обертка в QueryClientProvider
- Рендер <App />
```

### src/App.tsx
```typescript
Корневой компонент:
- AuthInitializer (инициализация auth)
- RouterProvider (роутинг)
```

### src/app/router.tsx
```typescript
Конфигурация роутинга:
- Lazy loading всех страниц
- Protected routes по ролям
- Fallback на PageLoader
```

---

## FEATURES - Детальное описание

### 1. features/auth (Аутентификация)

#### auth/pages/LoginPage.tsx
- Google OAuth кнопка
- Форма логина (email/password)
- Редирект на dashboard после входа

#### auth/pages/AuthCallbackPage.tsx
- Обработка OAuth callback
- Получение токена
- Сохранение в store
- Редирект на нужный dashboard

#### auth/components/AuthInitializer.tsx
- Проверка токена при загрузке
- Восстановление сессии
- Инициализация user данных

#### auth/components/ProtectedRoute.tsx
- Проверка авторизации
- Проверка ролей пользователя
- Редирект на login если не авторизован

#### auth/store/authStore.ts
- Zustand store для auth
- user, token, isAuthenticated
- login(), logout(), setUser()

#### auth/services/authService.ts
- API методы:
  - login(credentials)
  - logout()
  - getCurrentUser()
  - refreshToken()

---

### 2. features/admin-dashboard (Админ панель)

#### admin-dashboard/pages/Dashboard.tsx
- Главная страница админа
- Статистика системы
- Графики активности

#### admin-dashboard/pages/AdminShopsPage.tsx
- Список всех магазинов
- Фильтры и поиск
- Действия: просмотр, блокировка

#### admin-dashboard/pages/shops-pending/AdminShopsPendingPage.tsx
- Магазины на модерации
- Одобрение/отклонение
- Просмотр документов

#### admin-dashboard/pages/shop-profile/AdminShopProfilePage.tsx
- Детальная информация о магазине
- История операций
- Управление статусом

#### admin-dashboard/pages/users/AdminUsersPage.tsx
- Список пользователей
- Фильтры по роли
- Действия: блокировка, редактирование

#### admin-dashboard/pages/users/AdminUserProfilePage.tsx
- Профиль пользователя
- История заказов
- Управление правами

#### admin-dashboard/pages/categories/AdminCategoriesPage.tsx
- Управление категориями
- CRUD операции
- Иерархия категорий

#### admin-dashboard/pages/reviews/AdminReviewsPage.tsx
- Модерация отзывов
- Фильтры
- Блокировка неподобающих

#### admin-dashboard/pages/logs/AdminLogsPage.tsx
- Системные логи
- Фильтры по типу/дате
- Поиск

#### admin-dashboard/pages/reports/AdminReportsPage.tsx
- Отчеты по системе
- Экспорт в Excel
- Графики

#### admin-dashboard/pages/analytics/AdminAnalyticsPage.tsx
- Аналитика всей платформы
- Метрики эффективности
- Сравнение периодов

#### admin-dashboard/pages/notifications/AdminNotificationsPage.tsx
- Системные уведомления
- Рассылка админов
- История

---

### 3. features/shop-dashboard (Панель магазина)

#### shop-dashboard/pages/Dashboard.tsx
- Главная магазина
- Статистика продаж
- Недавние заказы

#### shop-dashboard/pages/ShopRegistrationPage.tsx
- Регистрация нового магазина
- Загрузка документов
- Отправка на модерацию

#### shop-dashboard/pages/profile/ShopProfilePage.tsx
- Редактирование профиля магазина
- Загрузка логотипа
- Контактная информация

#### shop-dashboard/pages/customers/CustomersPage.tsx
- База клиентов
- Фильтры и поиск
- Экспорт

#### shop-dashboard/pages/whatsapp/WhatsAppQRPage.tsx
- QR код для подключения WhatsApp
- Инструкции по подключению
- Статус соединения

#### shop-dashboard/pages/whatsapp-manage/ShopWhatsAppPage.tsx
- Управление WhatsApp интеграцией
- Настройки автоответов
- Шаблоны сообщений

#### shop-dashboard/pages/reports/ShopReportsPage.tsx
- Отчеты магазина
- Продажи, аренды
- Экспорт

#### shop-dashboard/pages/reviews/ShopReviewsPage.tsx
- Отзывы на магазин
- Ответы на отзывы
- Рейтинг

#### shop-dashboard/pages/notifications/ShopNotificationsPage.tsx
- Уведомления магазина
- Настройки получения
- История

---

### 4. features/products (Продукты)

#### products/pages/ShopProductsPage.tsx
- Управление товарами магазина
- CRUD операции
- Загрузка фото
- Управление наличием

#### products/pages/AdminProductsPage.tsx
- Все продукты в системе
- Модерация
- Блокировка

#### products/components/
- ProductForm - форма создания/редактирования
- ProductCard - карточка товара
- ProductFilters - фильтры
- ProductImages - управление фото

#### products/services/
- API методы для товаров
- CRUD операции
- Загрузка изображений

#### products/store/
- Zustand store для товаров
- Кэширование списка
- Фильтры

---

### 5. features/orders (Заказы)

#### orders/pages/ShopOrdersPage.tsx
- Заказы магазина
- Статусы заказов
- Обновление статуса
- Детали заказа

#### orders/pages/AdminOrdersPage.tsx
- Все заказы в системе
- Мониторинг
- Вмешательство в проблемные

#### orders/components/OrderDetailModal.tsx
- Модальное окно с деталями заказа
- Информация о клиенте
- Товары в заказе
- История статусов

#### orders/services/orders.service.ts
- getOrders()
- updateOrderStatus()
- getOrderDetails()

---

### 6. features/newsletters (Рассылки)

#### newsletters/pages/ShopNewslettersPage.tsx
- Создание рассылок
- База контактов
- История отправок

#### newsletters/pages/AdminNewslettersPage.tsx
- Админ просмотр всех рассылок
- Статистика

#### newsletters/components/CreateNewsletterTab.tsx
- Форма создания рассылки
- Шаблоны
- Выбор получателей

#### newsletters/components/NewsletterHistoryTab.tsx
- История отправленных
- Статистика открытий/кликов

#### newsletters/components/ContactsTab.tsx
- Управление контактами
- Импорт/экспорт
- Группы

#### newsletters/components/ContactsImportModal.tsx
- Импорт из Excel
- Валидация данных
- Дубликаты

#### newsletters/components/ContactFormModal.tsx
- Добавление/редактирование контакта
- Валидация телефона/email

#### newsletters/components/NewsletterDetailModal.tsx
- Просмотр деталей рассылки
- Статистика
- Список получателей

#### newsletters/services/
- newsletters.service.ts - API рассылок
- contacts.service.ts - API контактов

---

### 7. features/billing (Биллинг)

#### billing/pages/BillingPage.tsx
- Текущий баланс
- История транзакций
- Активные аренды

#### billing/pages/TopUpPage.tsx
- Пополнение баланса
- Выбор суммы
- Интеграция с платежной системой

#### billing/components/ActiveRentals.tsx
- Список активных аренд
- Даты окончания
- Продление

#### billing/components/TransactionHistory.tsx
- История всех транзакций
- Фильтры
- Экспорт

#### billing/hooks/useBilling.ts
- Хук для работы с балансом
- Автообновление
- Проверка достаточности средств

---

### 8. features/analytics (Аналитика)

#### analytics/pages/ShopAnalyticsPage.tsx
- Аналитика магазина
- Графики продаж
- Популярные товары
- Выручка по периодам

#### analytics/components/PeriodSelector.tsx
- Выбор периода для аналитики
- Предустановки (день, неделя, месяц, год)

#### analytics/components/DateRangePresets.tsx
- Быстрый выбор диапазона дат
- Кастомный диапазон

---

### 9. features/notifications (Уведомления)

#### notifications/components/
- NotificationBell - иконка с количеством
- NotificationList - список уведомлений
- NotificationItem - одно уведомление

#### notifications/services/
- getNotifications()
- markAsRead()
- deleteNotification()

#### notifications/store/
- Zustand store
- Real-time updates через WebSocket

---

### 10. features/websocket (WebSocket)

#### websocket/WebSocketManager.ts
- Менеджер WebSocket соединений
- Автопереподключение
- Обработка событий

#### websocket/hooks/useWebSocketEvent.ts
- Хук для подписки на события
- useEffect cleanup
- Типизация событий

#### websocket/services/
- Инициализация соединения
- Отправка событий
- Обработка ошибок

---

### 11. features/payment (Платежи)

#### payment/pages/PaymentSuccessPage.tsx
- Страница успешной оплаты
- Детали транзакции
- Кнопка возврата

#### payment/pages/PaymentCancelPage.tsx
- Страница отмененного платежа
- Причина отмены
- Повторная попытка

---

### 12. features/user-dashboard (Панель пользователя)

#### user-dashboard/pages/Dashboard.tsx
- Главная пользователя
- Избранное
- История

#### user-dashboard/pages/ProfilePage.tsx
- Профиль пользователя
- Редактирование данных
- Смена пароля

---

## SHARED - Переиспользуемые компоненты

### shared/components/ui/

#### Button.tsx
- Универсальная кнопка
- Варианты: primary, secondary, danger, ghost
- Размеры: sm, md, lg
- Loading state

#### Modal.tsx
- Модальное окно
- Backdrop
- Анимации
- Закрытие по ESC/клику вне

#### DataTable.tsx
- Таблица данных
- Сортировка
- Пагинация
- Поиск
- Экспорт

#### Pagination.tsx
- Компонент пагинации
- Переход по страницам
- Выбор количества на странице

#### SearchInput.tsx
- Поле поиска с иконкой
- Debounce
- Очистка

#### Select.tsx
- Dropdown выбор
- Поиск внутри
- Множественный выбор

#### Input.tsx
- Текстовое поле
- Валидация
- Error states
- Icons

#### Tabs.tsx
- Вкладки
- Контент вкладок
- Controlled/Uncontrolled

#### StatusBadge.tsx
- Бейдж статуса
- Цвета по типу статуса
- Варианты: success, warning, danger, info

#### ConfirmDialog.tsx
- Диалог подтверждения
- Кастомные кнопки
- Async actions

#### DetailModal.tsx
- Модальное окно деталей
- Универсальное для разных сущностей

#### EmptyState.tsx
- Пустое состояние
- Иллюстрация
- CTA кнопка

#### ExcelExport.tsx
- Экспорт данных в Excel
- Форматирование
- Множественные листы

#### ExcelUpload.tsx
- Загрузка Excel файлов
- Парсинг
- Валидация

#### ImageUploadSingle.tsx
- Загрузка одного изображения
- Превью
- Crop

#### ImageUploadMultiple.tsx
- Загрузка нескольких изображений
- Сортировка
- Удаление

#### VirtualList.tsx
- Виртуализированный список
- Оптимизация для больших данных
- Бесконечная прокрутка

#### Tooltip.tsx
- Всплывающие подсказки
- Позиционирование

#### RejectModal.tsx
- Модальное окно отклонения
- Причина отклонения
- Textarea

#### PhoneInput.tsx
- Ввод телефона
- Маска
- Валидация

---

### shared/components/forms/

#### FormInput.tsx
- Input с интеграцией React Hook Form
- Автоматическая валидация
- Error messages

#### FormSelect.tsx
- Select с React Hook Form
- Validation

#### FormTextarea.tsx
- Textarea с RHF
- Счетчик символов

#### FormCheckbox.tsx
- Checkbox с RHF

#### FormRadio.tsx
- Radio buttons с RHF

#### FormDatePicker.tsx
- Выбор даты
- React Hook Form
- date-fns

#### FormDateRangePicker.tsx
- Выбор диапазона дат
- Валидация периода

#### FormImageUpload.tsx
- Загрузка изображений в форме
- Preview
- Validation

---

### shared/components/feedback/

#### Alert.tsx
- Уведомления/алерты
- Типы: success, error, warning, info
- Закрытие

#### Avatar.tsx
- Аватар пользователя/магазина
- Fallback на инициалы
- Размеры

#### Badge.tsx
- Бейджи
- Варианты цветов
- Счетчики

#### Card.tsx
- Карточка контента
- Header, Body, Footer
- Shadow variants

#### Spinner.tsx
- Индикатор загрузки
- Размеры
- Цвета

#### PageLoader.tsx
- Полноэкранный лоадер
- Для lazy loading страниц

#### Skeleton.tsx
- Skeleton loading
- Анимация
- Разные формы

---

### shared/components/charts/

#### LineChart.tsx
- Линейный график (Recharts)
- Responsive
- Tooltip

#### BarChart.tsx
- Столбчатая диаграмма
- Группировка
- Легенда

#### PieChart.tsx
- Круговая диаграмма
- Проценты
- Легенда

#### AreaChart.tsx
- Area график
- Градиенты
- Multiple lines

---

### shared/components/layout/

#### Header.tsx
- Шапка приложения
- Навигация
- Профиль пользователя

#### Sidebar.tsx
- Боковое меню
- Навигация по разделам
- Сворачиваемое

#### Footer.tsx
- Подвал
- Копирайт
- Ссылки

#### Container.tsx
- Контейнер контента
- Max-width
- Padding

#### Grid.tsx
- Grid layout
- Responsive
- Gaps

#### Flex.tsx
- Flexbox layout
- Направление
- Выравнивание

---

### shared/hooks/

#### useDebounce.ts
- Debounce для поиска
- Configurable delay

#### useCSRF.ts
- CSRF токен
- Автоматическое обновление

#### useSecureStorage.ts
- Безопасное хранилище
- Шифрование
- localStorage/sessionStorage

#### useSanitizedInput.ts
- Санитизация пользовательского ввода
- XSS защита

#### usePerformanceMonitor.ts
- Мониторинг производительности
- Метрики
- Логирование

---

### shared/lib/

#### lib/api/client.ts
- Axios instance
- Interceptors
- Error handling
- Token refresh

#### lib/api/security-middleware.ts
- Security headers
- CSRF
- Request sanitization

#### lib/security/csrf.ts
- CSRF токен генерация
- Валидация

#### lib/security/sanitize.ts
- DOMPurify
- HTML санитизация
- XSS защита

#### lib/security/storage.ts
- Безопасное хранение
- Шифрование токенов

#### lib/utils/cn.ts
- classNames утилита (clsx + tailwind-merge)
- Условные классы

#### lib/utils/performance.ts
- Performance утилиты
- Debounce, throttle
- Memoization

#### lib/validation/schemas.ts
- Zod схемы валидации
- Переиспользуемые схемы
- Email, phone, etc.

---

### shared/constants/

#### config.ts
- ROUTES константы
- API URLs
- App configuration

#### api-endpoints.ts
- Все API endpoints
- Типизированные

---

### shared/types/

#### common.ts
- Общие TypeScript типы
- User, Shop, Product базовые типы
- API Response types

---

## PAGES - Старые страницы (к миграции)

### pages/admin/refunds/RefundsPage.tsx
- Управление возвратами
- **TODO**: Перенести в features/admin-dashboard/pages/refunds/

### pages/admin/settings/SettingsPage.tsx
- Настройки системы
- **TODO**: Перенести в features/admin-dashboard/pages/settings/

### pages/admin/wardrobes/WardrobesPage.tsx
- Управление гардеробами
- **TODO**: Перенести в features/admin-dashboard/pages/wardrobes/

---

## TESTS

### tests/setup.ts
- Vitest setup
- Mock setup
- Test utilities

### tests/mocks/handlers.ts
- MSW request handlers
- Mock API responses

### tests/mocks/server.ts
- MSW server setup

### tests/utils/test-utils.tsx
- Render with providers
- Custom queries

---

## Итоговая статистика

### Всего файлов:
- **Features**: ~14 модулей
- **Pages**: ~50+ страниц
- **Shared components**: ~50+ компонентов
- **Hooks**: ~10+ хуков
- **Services**: ~15+ сервисов
- **Stores**: ~10+ Zustand stores

### Структура кода:
- **TypeScript**: 100%
- **React 19**: Functional components + hooks
- **State**: Zustand + TanStack Query
- **Routing**: React Router 7
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest + Playwright

### Архитектура:
- ✅ Feature-Sliced Design
- ✅ Модульность
- ✅ Типизация
- ✅ Code splitting
- ✅ Security (CSRF, sanitization)
- ⚠️ 3 страницы требуют миграции
