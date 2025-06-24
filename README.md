# UZMTO Афиша - SharePoint Framework Component

## Описание

SharePoint Framework веб-часть для отображения кинопремьер с сайта Afisha.uz. Компонент показывает карточки фильмов с постерами, жанрами и датами премьер в горизонтально прокручиваемом слайдере.

![SPFx Version](https://img.shields.io/badge/SPFx-1.18.0-green.svg)
![Node.js Version](https://img.shields.io/badge/Node.js-16.x-blue.svg)
![React Version](https://img.shields.io/badge/React-17.0.1-blue.svg)

## Возможности

- ✨ Отображение актуальных кинопремьер
- 🎬 Карточки фильмов с постерами и информацией
- 📱 Адаптивный дизайн для мобильных устройств
- ⚙️ Настраиваемые параметры через Property Pane
- 🔄 Автоматическое обновление данных
- 🎨 Поддержка темной и светлой тем SharePoint
- 🔗 Переход на страницы фильмов на Afisha.uz

## Технологии

- SharePoint Framework 1.18.0
- React 17.0.1 + TypeScript
- Fluent UI React
- SCSS Modules
- Node.js 16.x

## Предварительные требования

- Node.js 16.x (LTS)
- SharePoint Framework development environment
- Gulp CLI: `npm install -g gulp-cli`
- Yeoman SharePoint generator: `npm install -g @microsoft/generator-sharepoint`

## Установка и запуск

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd uzmto-afisha-component
```

### 2. Установка зависимостей
```bash
npm install
```

### 3. Запуск в режиме разработки
```bash
gulp serve
```
Откроется браузер с SharePoint Workbench для тестирования компонента.

### 4. Сборка для продакшена
```bash
gulp build
gulp bundle --ship
gulp package-solution --ship
```

Файл `.sppkg` будет создан в папке `sharepoint/solution/`.

## Настройки компонента

Компонент поддерживает следующие настройки через Property Pane:

| Параметр | Описание | По умолчанию |
|----------|----------|--------------|
| Описание | Описание компонента | - |
| Максимальное количество фильмов | Лимит отображаемых фильмов (5-50) | 20 |
| Показывать жанры | Отображение жанров фильмов | Включено |
| Показывать даты премьер | Отображение дат премьер | Включено |
| Автоматическое обновление | Периодическое обновление данных | Выключено |

## Структура проекта

```
src/
├── webparts/
│   └── afishaComponent/
│       ├── components/
│       │   ├── AfishaComponent.tsx          # Основной React компонент
│       │   ├── AfishaComponent.module.scss  # Стили компонента
│       │   └── IAfishaComponentProps.ts     # Интерфейс props
│       ├── loc/                             # Локализация
│       ├── AfishaComponentWebPart.ts        # Главный файл веб-части
│       └── AfishaComponentWebPart.manifest.json
config/                                      # Конфигурационные файлы
package.json                                # Зависимости проекта
gulpfile.js                                 # Задачи сборки
```

## API Integration

Компонент использует API сайта Afisha.uz для получения данных о фильмах:

- **Endpoint**: `https://www.afisha.uz/api/videos/premieres`
- **CORS Proxy**: `https://corsproxy.io/` (для обхода CORS ограничений)
- **Параметры**: локаль, регион премьеры, даты фильтров

### Пример ответа API:
```json
{
  "hydra:member": [
    {
      "@id": "/api/videos/123",
      "title": "Название фильма",
      "originalTitle": "Original Title",
      "slug": "film-slug",
      "year": 2025,
      "genres": [{"name": "Драма"}],
      "mainMediaObject": {
        "variantUrls": {
          "medium": "/uploads/media/poster.jpg"
        }
      },
      "worldPremiereDate": "2025-06-01T00:00:00+05:00"
    }
  ]
}
```

## Развертывание

### В SharePoint Online
1. Соберите решение: `gulp package-solution --ship`
2. Загрузите `.sppkg` файл в App Catalog
3. Разверните приложение на нужных сайтах
4. Добавьте веб-часть на страницу

### В SharePoint On-Premises
1. Убедитесь в совместимости SPFx версии
2. Настройте CDN для статических ресурсов
3. Загрузите в локальный App Catalog

## Команды разработки

| Команда | Описание |
|---------|----------|
| `npm install` | Установка зависимостей |
| `gulp serve` | Запуск dev server |
| `gulp build` | Сборка проекта |
| `gulp clean` | Очистка временных файлов |
| `gulp test` | Запуск тестов |
| `gulp package-solution` | Создание .sppkg пакета |

## Troubleshooting

### Распространенные проблемы:

1. **CORS ошибки**: Компонент использует CORS proxy. Убедитесь в доступности `corsproxy.io`

2. **Ошибки Node.js**: Используйте Node.js 16.x LTS

3. **Проблемы сборки**: Очистите кеш:
   ```bash
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

4. **Отсутствуют изображения**: Проверьте доступность CDN Afisha.uz

## Лицензия

MIT License - см. файл LICENSE

## Автор

Разработано для UZMTO

## Contributing

1. Fork проекта
2. Создайте feature branch
3. Commit изменения
4. Push в branch
5. Создайте Pull Request

## Changelog

### v1.0.0
- Первый релиз
- Интеграция с Afisha.uz API
- Адаптивный дизайн
- Настройки Property Pane
- Поддержка тем SharePoint
