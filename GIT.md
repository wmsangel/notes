# Как выложить проект на Git (GitHub)

## 1. Первый коммит уже сделан

В корне проекта уже есть репозиторий и первый коммит (без `node_modules`, `.env` и лишнего — см. `.gitignore`).

## 2. Создать репозиторий на GitHub

1. Зайдите на [github.com](https://github.com) и войдите в аккаунт.
2. Нажмите **+** → **New repository**.
3. Укажите:
   - **Repository name:** например `notes-app` или `notes_new`.
   - **Public**.
   - **НЕ** ставьте галочки «Add a README» / «Add .gitignore» — у вас уже есть код локально.
4. Нажмите **Create repository**.

## 3. Привязать удалённый репозиторий и отправить код

В терминале из корня проекта выполните (подставьте свой логин и имя репо):

```bash
cd /Users/igorzagorodnyi/Sites/notes_new

# Добавить удалённый репозиторий (замените YOUR_USERNAME и REPO_NAME на свои)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Отправить код в ветку main
git push -u origin main
```

Если репозиторий создан с именем `notes-app`, а ваш логин GitHub — `igorzagorodnyi`, то:

```bash
git remote add origin https://github.com/igorzagorodnyi/notes-app.git
git push -u origin main
```

При первом `git push` браузер может запросить вход в GitHub (логин/пароль или токен).

## 4. Дальнейшие изменения

После правок в коде:

```bash
git add .
git commit -m "Краткое описание изменений"
git push
```

---

**SSH вместо HTTPS:** если настроен ключ SSH, используйте адрес вида `git@github.com:YOUR_USERNAME/REPO_NAME.git` вместо `https://github.com/...`.
