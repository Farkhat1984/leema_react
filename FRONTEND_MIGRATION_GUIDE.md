# Frontend Migration Guide - Upload Structure Changes

> **Для Flutter и React разработчиков**
>
> **Дата миграции:** TBD (будет объявлено за неделю)
>
> **Обратная совместимость:** Старые URL будут работать 30 дней после миграции

---

## 🎯 Что изменилось?

Backend реорганизовал структуру uploads для лучшей масштабируемости и изоляции данных.

### Старая структура (плоская):
```
/uploads/products/{uuid}.jpg
/uploads/shop_images/{uuid}.jpg
/uploads/newsletter_images/{uuid}.jpg
/uploads/generations/{user_id}/{file}.jpg
```

### Новая структура (иерархическая):
```
/uploads/shops/{shop_id}/products/{product_id}/{uuid}.jpg
/uploads/shops/{shop_id}/avatar.jpg
/uploads/shops/{shop_id}/newsletters/templates/{uuid}.jpg
/uploads/users/{user_id}/generations/{file}.jpg
```

---

## ✅ Хорошие новости - минимальные изменения!

**Большинство изменений прозрачны для фронтенда:**
- API возвращает правильные URL автоматически
- Не нужно менять отображение изображений
- Не нужно менять логику загрузки URL из API

---

## ⚠️ Что НУЖНО изменить

### 1. Product Image Upload - ОБЯЗАТЕЛЬНО

**Было:**
```javascript
// React/Axios
await axios.post('/api/v1/products/upload-images', formData);

// Flutter/Dio
await dio.post('/api/v1/products/upload-images', data: formData);
```

**Стало (добавить product_id):**
```javascript
// React/Axios
await axios.post('/api/v1/products/upload-images?product_id=123', formData);

// Flutter/Dio
await dio.post(
  '/api/v1/products/upload-images',
  data: formData,
  queryParameters: {'product_id': 123}
);
```

**Важно:**
- `product_id` должен быть ID существующего продукта
- Сначала создайте продукт, потом загружайте изображения
- API вернет ошибку если product_id не указан

### 2. Newsletter Image Upload - ОПЦИОНАЛЬНО

Можно указать `newsletter_id` для организации (но не обязательно):

```javascript
// С newsletter_id (рекомендуется)
POST /api/v1/newsletters/upload-image?newsletter_id=456

// Без newsletter_id (использует папку templates)
POST /api/v1/newsletters/upload-image
```

---

## 📋 Полный список изменений URL

### Product Images
```diff
- OLD: /uploads/products/abc123.jpg
+ NEW: /uploads/shops/5/products/42/abc123.jpg
```
✅ **Действие:** URL приходят из API, ничего не меняем

### Shop Avatars
```diff
- OLD: /uploads/shop_images/xyz789.jpg
+ NEW: /uploads/shops/5/avatar.jpg
```
✅ **Действие:** URL приходят из API, ничего не меняем

### Newsletter Images
```diff
- OLD: /uploads/newsletter_images/img001.jpg
+ NEW: /uploads/shops/5/newsletters/templates/img001.jpg
```
✅ **Действие:** URL приходят из API, ничего не меняем

### User Avatars
```
UNCHANGED: /uploads/users/10/avatar.jpg
```
✅ **Действие:** Ничего не меняется

### Wardrobe Items
```
UNCHANGED: /uploads/users/10/wardrobe/25/image_0.jpg
```
✅ **Действие:** Ничего не меняется

### AI Generations
```diff
- OLD: /uploads/generations/10/gen123_result.jpg
+ NEW: /uploads/users/10/generations/gen123_result.jpg
```
✅ **Действие:** URL приходят из API, ничего не меняем

---

## 🧪 Тестирование - Checklist

### Для Flutter Team

```dart
// 1. Обновите product upload
final response = await dio.post(
  '/api/v1/products/upload-images',
  data: formData,
  queryParameters: {'product_id': productId}, // ← ДОБАВИТЬ
);

// 2. После миграции - очистите кэш изображений
CachedNetworkImage.evictFromCache(imageUrl);
ImageCache.clear();
```

**Проверьте:**
- [ ] Product upload работает с новым параметром
- [ ] Изображения продуктов отображаются
- [ ] Аватары магазинов отображаются
- [ ] Wardrobe изображения работают
- [ ] AI генерации отображаются
- [ ] Кэш изображений очищен после миграции

### Для React Team

```javascript
// 1. Обновите product upload
const uploadImages = async (productId, files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  const response = await axios.post(
    `/api/v1/products/upload-images?product_id=${productId}`, // ← ДОБАВИТЬ
    formData
  );
  return response.data;
};

// 2. После миграции - очистите кэш браузера
// В DevTools: Application → Clear Storage → Clear site data
```

**Проверьте:**
- [ ] Product upload работает с новым параметром
- [ ] Все изображения отображаются корректно
- [ ] Newsletter image upload работает (опционально с newsletter_id)
- [ ] Browser cache очищен после миграции
- [ ] Service Worker кэш обновлен (если используется)

---

## 🔍 Как проверить что всё работает

### 1. Проверка API Response

**До миграции не требуется изменений в коде!** Просто проверьте что API возвращает корректные URL:

```bash
# Products
GET /api/v1/products/123
Response: {
  "images": [
    "/uploads/shops/5/products/123/abc.jpg"  ← Новый формат
  ]
}

# Shop
GET /api/v1/shops/me
Response: {
  "avatar_url": "/uploads/shops/5/avatar.jpg"  ← Новый формат
}

# Wardrobe
GET /api/v1/wardrobe
Response: [{
  "images": [
    "/uploads/users/10/wardrobe/25/image_0.jpg"  ← Новый формат
  ]
}]
```

### 2. Проверка загрузки изображений

```javascript
// React Example - тестирование upload
const testProductUpload = async () => {
  try {
    // 1. Создайте продукт (если еще не создан)
    const product = await createProduct({...});

    // 2. Загрузите изображения с product_id
    const result = await uploadImages(product.id, files);

    console.log('✅ Upload successful:', result.urls);

    // 3. Проверьте что изображения отображаются
    // URLs должны содержать: /uploads/shops/{shop_id}/products/{product_id}/

  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
};
```

```dart
// Flutter Example - тестирование upload
Future<void> testProductUpload() async {
  try {
    // 1. Создайте продукт
    final product = await createProduct(...);

    // 2. Загрузите изображения с product_id
    final formData = FormData.fromMap({
      'files': files.map((f) => MultipartFile.fromFileSync(f.path)).toList(),
    });

    final response = await dio.post(
      '/api/v1/products/upload-images',
      data: formData,
      queryParameters: {'product_id': product.id},
    );

    print('✅ Upload successful: ${response.data}');

  } catch (e) {
    print('❌ Upload failed: $e');
  }
}
```

---

## 🚨 Возможные проблемы и решения

### Проблема: 404 Not Found на изображениях

**Причина:** Старые URL в кэше

**Решение:**
```javascript
// React - очистить кэш браузера
localStorage.clear();
sessionStorage.clear();
// + Hard Reload (Ctrl+Shift+R)

// Flutter - очистить кэш изображений
await CachedNetworkImage.evictFromCache(imageUrl);
await ImageCache.clear();
```

### Проблема: Product upload возвращает 422 Validation Error

**Причина:** Не указан `product_id`

**Решение:**
```javascript
// Добавьте product_id в query параметры
POST /api/v1/products/upload-images?product_id=123
```

### Проблема: Изображения не загружаются после миграции

**Причина:** Кэш содержит старые URL

**Решение:**
1. Очистите кэш приложения/браузера
2. Перезапустите приложение
3. Проверьте что API возвращает новые URL

---

## 📞 Поддержка

### Если что-то не работает:

**1. Проверьте версию backend:**
```bash
curl https://api.leema.kz/health
# Должна быть версия с поддержкой новой структуры
```

**2. Проверьте что API возвращает новые URL:**
```bash
curl https://api.leema.kz/api/v1/shops/me -H "Authorization: Bearer YOUR_TOKEN"
# avatar_url должен содержать: /uploads/shops/{id}/avatar.jpg
```

**3. Свяжитесь с backend командой:**
- **Slack:** #backend-support
- **Email:** backend-team@leema.kz
- **Emergency:** oncall-backend@leema.kz

---

## 📅 Timeline миграции

1. **Сейчас:** Backend изменения готовы, фронтенд может тестировать
2. **Через неделю:** Объявление точной даты миграции
3. **День миграции:**
   - Backend запускает migration script
   - Старые URL продолжают работать (30 дней)
4. **После миграции:**
   - Фронтенд команды обновляют product upload
   - Тестирование на staging
   - Очистка кэшей
5. **Через 30 дней:** Старые URL перестают работать

---

## ✅ Итоговый Checklist

### Перед миграцией:
- [ ] Код обновлен (добавлен `product_id` в upload)
- [ ] Проведено локальное тестирование
- [ ] Code review пройден

### В день миграции:
- [ ] Backend команда запустила migration
- [ ] Получено подтверждение успешной миграции
- [ ] Staging apps протестированы

### После миграции:
- [ ] Кэш приложений очищен
- [ ] Все функции с изображениями протестированы
- [ ] Пользователи не сообщают о проблемах
- [ ] Мониторинг не показывает ошибок

---

## 🎉 Заключение

**Минимальные изменения для фронтенда:**
- ✅ Только один endpoint требует изменений (product upload)
- ✅ Все остальное работает автоматически
- ✅ 30 дней обратной совместимости
- ✅ Backend команда готова помочь

**Вопросы?** Пишите в #backend-support! 🚀
