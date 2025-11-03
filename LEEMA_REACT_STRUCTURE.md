# Полная структура проекта LEEMA_REACT

## Общая информация
Проект использует Feature-Sliced Design архитектуру с разделением на features, shared и pages.

## Основная структура

```
leema_react/
├── src/
│   ├── app/                    # Конфигурация приложения
│   │   └── router.tsx          # Роутинг всего приложения
│   ├── features/               # ОСНОВНЫЕ ФИЧИ (весь функционал)
│   ├── shared/                 # Переиспользуемые компоненты и утилиты
│   ├── pages/                  # ТОЛЬКО 3 старых страницы админа
│   ├── assets/                 # Изображения и стили
│   ├── tests/                  # Тесты
│   ├── main.tsx               # Entry point
│   └── App.tsx                # Root component
```

---

## FEATURES - Основная бизнес-логика

### 1. **admin-dashboard** (Админ панель)
```
features/admin-dashboard/
├── components/          # Компоненты админки
├── hooks/              # Хуки для админ панели
├── pages/              # Страницы админа
│   ├── Dashboard.tsx                    # Главная админа
│   ├── AdminShopsPage.tsx               # Управление магазинами
│   ├── analytics/
│   │   └── AdminAnalyticsPage.tsx       # Аналитика админа
│   ├── categories/
│   │   └── AdminCategoriesPage.tsx      # Категории
│   ├── logs/
│   │   └── AdminLogsPage.tsx            # Логи системы
│   ├── notifications/
│   │   └── AdminNotificationsPage.tsx   # Уведомления админа
│   ├── reports/
│   │   └── AdminReportsPage.tsx         # Отчеты
│   ├── reviews/
│   │   └── AdminReviewsPage.tsx         # Отзывы
│   ├── shop-profile/
│   │   └── AdminShopProfilePage.tsx     # Профиль магазина
│   ├── shops-pending/
│   │   └── AdminShopsPendingPage.tsx    # Ожидающие магазины
│   └── users/
│       ├── AdminUsersPage.tsx           # Пользователи
│       └── AdminUserProfilePage.tsx     # Профиль пользователя
├── services/           # API сервисы для админа
├── store/             # State management (Zustand)
└── types/             # TypeScript типы
```

### 2. **analytics** (Аналитика)
```
features/analytics/
├── components/
│   ├── DateRangePresets.tsx    # Пресеты дат
│   └── PeriodSelector.tsx       # Выбор периода
├── pages/
│   └── ShopAnalyticsPage.tsx    # Аналитика магазина
├── services/                    # API сервисы
├── types/                       # Типы данных аналитики
└── index.ts
```

### 3. **auth** (Аутентификация)
```
features/auth/
├── components/
│   ├── AuthInitializer.tsx      # Инициализация авторизации
│   └── ProtectedRoute.tsx       # Защищенные маршруты
├── hooks/                       # Хуки для авторизации
├── pages/
│   ├── LoginPage.tsx            # Страница входа
│   └── AuthCallbackPage.tsx     # OAuth callback
├── services/
│   └── authService.ts           # API авторизации
├── store/
│   └── authStore.ts             # State (Zustand)
├── types/                       # Типы auth
└── index.ts
```

### 4. **billing** (Биллинг)
```
features/billing/
├── components/
│   ├── ActiveRentals.tsx        # Активные аренды
│   └── TransactionHistory.tsx   # История транзакций
├── hooks/
│   └── useBilling.ts            # Хуки биллинга
├── pages/
│   ├── BillingPage.tsx          # Страница биллинга
│   └── TopUpPage.tsx            # Пополнение баланса
├── services/                    # API биллинга
├── store/                       # State management
├── types/                       # Типы биллинга
└── index.ts
```

### 5. **newsletters** (Рассылки)
```
features/newsletters/
├── components/
│   ├── ContactFormModal.tsx         # Форма контакта
│   ├── ContactsImportModal.tsx      # Импорт контактов
│   ├── ContactsTab.tsx              # Вкладка контактов
│   ├── CreateNewsletterTab.tsx      # Создание рассылки
│   ├── NewsletterDetailModal.tsx    # Детали рассылки
│   └── NewsletterHistoryTab.tsx     # История рассылок
├── hooks/                           # Хуки рассылок
├── lib/
│   └── validation.ts                # Валидация
├── pages/
│   ├── AdminNewslettersPage.tsx     # Рассылки админа
│   └── ShopNewslettersPage.tsx      # Рассылки магазина
├── services/
│   ├── contacts.service.ts          # API контактов
│   └── newsletters.service.ts       # API рассылок
├── store/                           # State
├── types/                           # Типы
└── index.ts
```

### 6. **notifications** (Уведомления)
```
features/notifications/
├── components/              # Компоненты уведомлений
├── hooks/                  # Хуки
├── pages/                  # Страницы (если есть)
├── services/               # API уведомлений
├── store/                  # State
└── types/                  # Типы
```

### 7. **orders** (Заказы)
```
features/orders/
├── components/
│   └── OrderDetailModal.tsx     # Детали заказа
├── pages/
│   ├── AdminOrdersPage.tsx      # Заказы админа
│   └── ShopOrdersPage.tsx       # Заказы магазина
├── services/
│   └── orders.service.ts        # API заказов
├── types/
│   └── order.types.ts           # Типы заказов
└── index.ts
```

### 8. **payment** (Платежи)
```
features/payment/
└── pages/
    ├── PaymentSuccessPage.tsx   # Успешный платеж
    └── PaymentCancelPage.tsx    # Отмененный платеж
```

### 9. **products** (Продукты/Товары)
```
features/products/
├── components/              # Компоненты продуктов
├── hooks/                  # Хуки
├── pages/
│   ├── AdminProductsPage.tsx    # Продукты админа
│   └── ShopProductsPage.tsx     # Продукты магазина
├── services/               # API продуктов
├── store/                  # State
└── types/                  # Типы продуктов
```

### 10. **shop-dashboard** (Панель магазина)
```
features/shop-dashboard/
├── components/              # Компоненты панели магазина
├── hooks/                  # Хуки
├── pages/
│   ├── Dashboard.tsx                    # Главная магазина
│   ├── ShopRegistrationPage.tsx         # Регистрация магазина
│   ├── customers/
│   │   └── CustomersPage.tsx            # Клиенты
│   ├── notifications/
│   │   └── ShopNotificationsPage.tsx    # Уведомления
│   ├── profile/
│   │   └── ShopProfilePage.tsx          # Профиль магазина
│   ├── reports/
│   │   └── ShopReportsPage.tsx          # Отчеты
│   ├── reviews/
│   │   └── ShopReviewsPage.tsx          # Отзывы
│   ├── whatsapp/
│   │   └── WhatsAppQRPage.tsx           # QR-код WhatsApp
│   └── whatsapp-manage/
│       └── ShopWhatsAppPage.tsx         # Управление WhatsApp
├── services/               # API сервисы
├── store/                  # State
└── types/                  # Типы
```

### 11. **user-dashboard** (Панель пользователя)
```
features/user-dashboard/
└── pages/
    ├── Dashboard.tsx            # Главная пользователя
    ├── ProfilePage.tsx          # Профиль
    ├── UserDashboardPage.tsx    # Дублирует Dashboard?
    └── UserProfilePage.tsx      # Дублирует ProfilePage?
```

### 12. **websocket** (WebSocket соединения)
```
features/websocket/
├── WebSocketManager.ts      # Менеджер WebSocket
├── components/             # Компоненты WebSocket
├── hooks/
│   └── useWebSocketEvent.ts # Хук для событий
├── pages/                  # Страницы (если нужны)
├── services/               # Сервисы
├── store/                  # State
├── types/                  # Типы
└── index.ts
```

---

## SHARED - Переиспользуемые компоненты

```
shared/
├── components/
│   ├── charts/                  # Компоненты графиков
│   │   ├── AreaChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── LineChart.tsx
│   │   ├── PieChart.tsx
│   │   └── index.ts
│   ├── feedback/                # UI для обратной связи
│   │   ├── Alert.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── PageLoader.tsx
│   │   ├── Skeleton.tsx
│   │   └── Spinner.tsx
│   ├── forms/                   # Формы
│   │   ├── FormCheckbox.tsx
│   │   ├── FormDatePicker.tsx
│   │   ├── FormDateRangePicker.tsx
│   │   ├── FormImageUpload.tsx
│   │   ├── FormInput.tsx
│   │   ├── FormRadio.tsx
│   │   ├── FormSelect.tsx
│   │   ├── FormTextarea.tsx
│   │   ├── PhoneInput.tsx
│   │   └── index.ts
│   ├── layout/                  # Компоненты разметки
│   │   ├── Container.tsx
│   │   ├── Flex.tsx
│   │   ├── Footer.tsx
│   │   ├── Grid.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   └── ui/                      # UI компоненты
│       ├── Button.tsx
│       ├── ConfirmDialog.tsx
│       ├── DataTable.tsx
│       ├── DetailModal.tsx
│       ├── EmptyState.tsx
│       ├── ExcelExport.tsx
│       ├── ExcelUpload.tsx
│       ├── ImageUploadMultiple.tsx
│       ├── ImageUploadSingle.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Pagination.tsx
│       ├── PhoneInput.tsx
│       ├── RejectModal.tsx
│       ├── SearchInput.tsx
│       ├── Select.tsx
│       ├── StatusBadge.tsx
│       ├── Tabs.tsx
│       ├── Tooltip.tsx
│       ├── VirtualList.tsx
│       └── index.ts
├── constants/
│   ├── api-endpoints.ts         # API endpoints
│   └── config.ts                # Конфигурация
├── hooks/
│   ├── useCSRF.ts               # CSRF защита
│   ├── useDebounce.ts           # Debounce
│   ├── usePerformanceMonitor.ts # Мониторинг
│   ├── useSanitizedInput.ts     # Санитизация ввода
│   ├── useSecureStorage.ts      # Безопасное хранилище
│   └── index.ts
├── lib/
│   ├── api/
│   │   ├── client.ts                # API клиент (axios)
│   │   └── security-middleware.ts   # Security middleware
│   ├── security/
│   │   ├── csrf.ts                  # CSRF утилиты
│   │   ├── sanitize.ts              # Санитизация
│   │   ├── storage.ts               # Безопасное хранилище
│   │   └── index.ts
│   ├── utils/
│   │   ├── cn.ts                    # classNames утилита
│   │   ├── performance.ts           # Performance утилиты
│   │   └── index.ts
│   └── validation/
│       └── schemas.ts               # Zod схемы валидации
└── types/
    ├── common.ts                    # Общие типы
    └── index.ts
```

---

## PAGES - Старые страницы (НЕ используются в новой структуре!)

```
pages/
└── admin/                       # ТОЛЬКО 3 СТАРЫЕ СТРАНИЦЫ
    ├── refunds/
    │   └── RefundsPage.tsx      # Возвраты (старая)
    ├── settings/
    │   └── SettingsPage.tsx     # Настройки (старая)
    └── wardrobes/
        └── WardrobesPage.tsx    # Гардеробы (старая)
```

**ВАЖНО:** Эти страницы еще используются в router.tsx, но остальные страницы перенесены в features!

---

## Роутинг (app/router.tsx)

Все роуты определены в `/src/app/router.tsx`:

### Публичные роуты:
- `/login` → LoginPage
- `/auth/callback` → AuthCallbackPage
- `/payment/success` → PaymentSuccessPage
- `/payment/cancel` → PaymentCancelPage

### Роуты магазина (shop_owner):
- `/shop/dashboard` → ShopDashboard
- `/shop/register` → ShopRegistration
- `/shop/products` → ShopProducts
- `/shop/newsletter` → ShopNewsletters
- `/shop/analytics` → ShopAnalytics
- `/shop/orders` → ShopOrders
- `/shop/billing` → ShopBilling
- `/shop/billing/topup` → ShopTopUp
- `/shop/customers` → ShopCustomers
- `/shop/whatsapp-qr` → ShopWhatsAppQR
- `/shop/profile` → ShopProfile
- `/shop/reports` → ShopReports
- `/shop/notifications` → ShopNotifications
- `/shop/whatsapp` → ShopWhatsApp
- `/shop/reviews` → ShopReviews

### Роуты админа (admin):
- `/admin/dashboard` → AdminDashboard
- `/admin/products` → AdminProducts
- `/admin/shops` → AdminShops
- `/admin/newsletter` → AdminNewsletters
- `/admin/orders` → AdminOrders
- `/admin/settings` → AdminSettings (СТАРАЯ СТРАНИЦА)
- `/admin/refunds` → AdminRefunds (СТАРАЯ СТРАНИЦА)
- `/admin/wardrobes` → AdminWardrobes (СТАРАЯ СТРАНИЦА)
- `/admin/notifications` → AdminNotifications
- `/admin/shops-pending` → AdminShopsPending
- `/admin/shops/:shopId` → AdminShopProfile
- `/admin/users` → AdminUsers
- `/admin/users/:userId` → AdminUserProfile
- `/admin/reviews` → AdminReviews
- `/admin/categories` → AdminCategories
- `/admin/logs` → AdminLogs
- `/admin/reports` → AdminReports

### Роуты пользователя (user):
- `/user/dashboard` → UserDashboard
- `/user/profile` → UserProfile

---

## Технологический стек

### Core:
- React 19.1.1
- TypeScript 5.9.3
- Vite 7.1.7
- React Router 7.9.5

### State Management:
- Zustand 5.0.8
- TanStack Query 5.90.5

### UI:
- Tailwind CSS 4.1.16
- Radix UI (Dialog, Dropdown, Select, Tabs)
- Headless UI 2.2.9
- Lucide React (иконки)

### Forms:
- React Hook Form 7.66.0
- Zod 4.1.12 (валидация)

### Data Visualization:
- Recharts 3.3.0

### Utilities:
- Axios 1.13.1
- date-fns 4.1.0
- DOMPurify 3.3.0
- xlsx 0.18.5

### Testing:
- Vitest 4.0.6
- Playwright 1.56.1
- Testing Library

---

## Архитектурные паттерны

### Feature-Sliced Design:
Каждая фича содержит:
- `components/` - UI компоненты фичи
- `pages/` - Страницы фичи
- `hooks/` - Кастомные хуки
- `services/` - API взаимодействие
- `store/` - State management (Zustand)
- `types/` - TypeScript типы
- `index.ts` - Публичное API фичи

### Разделение ответственности:
- **features/** - Бизнес-логика по функциям
- **shared/** - Переиспользуемый код
- **pages/** - Старые страницы (будут мигрированы)
- **app/** - Конфигурация приложения

---

## Выводы по структуре

### ✅ Что ПРАВИЛЬНО:
1. **Большинство страниц в features/** - правильная архитектура
2. Каждая фича самодостаточна (компоненты, сервисы, типы)
3. Shared компоненты отделены
4. Lazy loading страниц для оптимизации
5. Protected routes для безопасности

### ⚠️ Что НУЖНО ИСПРАВИТЬ:
1. **3 старые страницы в pages/admin/** нужно перенести в features:
   - `RefundsPage.tsx` → `features/admin-dashboard/pages/refunds/`
   - `SettingsPage.tsx` → `features/admin-dashboard/pages/settings/`
   - `WardrobesPage.tsx` → `features/admin-dashboard/pages/wardrobes/`

2. **Дублирование в user-dashboard:**
   - `Dashboard.tsx` vs `UserDashboardPage.tsx`
   - `ProfilePage.tsx` vs `UserProfilePage.tsx`
   Нужно оставить только по одной странице

### 📋 Рекомендации:
1. Мигрировать последние 3 страницы из `pages/` в `features/`
2. Удалить дублирующиеся страницы в user-dashboard
3. Удалить папку `pages/` после миграции
4. Все новые функции создавать только в `features/`

