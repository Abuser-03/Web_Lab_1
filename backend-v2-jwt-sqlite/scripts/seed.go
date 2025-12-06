package main

import (
	"backend-go-postgres/internal/domain/entity"
	"backend-go-postgres/internal/infrastructure/database/sqlite"
	"fmt"
	"log"
)

func main() {
	fmt.Println("🌱 Генерация тестовых данных...")

	// Подключаемся к БД
	db, err := sqlite.NewDatabase("./data/linkmanager.db")
	if err != nil {
		log.Fatalf("Ошибка подключения к БД: %v", err)
	}
	defer db.Close()

	userRepo := sqlite.NewUserRepository(db.DB)
	linkRepo := sqlite.NewLinkRepository(db.DB)

	// Создаем тестовых пользователей
	users := []struct {
		username string
		email    string
		password string
		role     string
	}{
		{"admin", "admin@example.com", "admin123", "admin"},
		{"testuser", "test@example.com", "test123", "user"},
		{"john", "john@example.com", "john123", "user"},
	}

	createdUsers := make([]*entity.User, 0)
	for _, u := range users {
		user := &entity.User{
			Username: u.username,
			Email:    u.email,
			Role:     u.role, // Устанавливаем роль
		}
		if err := user.HashPassword(u.password); err != nil {
			log.Printf("Ошибка хеширования пароля для %s: %v", u.username, err)
			continue
		}
		if err := userRepo.Create(user); err != nil {
			log.Printf("Ошибка создания пользователя %s: %v", u.username, err)
			continue
		}
		createdUsers = append(createdUsers, user)
		fmt.Printf("✅ Создан пользователь: %s (email: %s, password: %s, role: %s)\n", u.username, u.email, u.password, u.role)
	}

	// Создаем тестовые ссылки для каждого пользователя
	testLinks := []struct {
		title       string
		url         string
		description string
	}{
		{"Google", "https://google.com", "Поисковая система №1 в мире"},
		{"GitHub", "https://github.com", "Хостинг кода и совместная разработка"},
		{"Stack Overflow", "https://stackoverflow.com", "Вопросы и ответы для программистов"},
		{"MDN Web Docs", "https://developer.mozilla.org", "Документация по веб-технологиям"},
		{"YouTube", "https://youtube.com", "Видеохостинг и образовательный контент"},
		{"Wikipedia", "https://wikipedia.org", "Свободная энциклопедия"},
		{"Reddit", "https://reddit.com", "Социальная сеть и форумы"},
		{"Twitter", "https://twitter.com", "Микроблоги и новости"},
		{"LinkedIn", "https://linkedin.com", "Профессиональная сеть"},
		{"Medium", "https://medium.com", "Блог-платформа для статей"},
		{"Dev.to", "https://dev.to", "Сообщество разработчиков"},
		{"Hacker News", "https://news.ycombinator.com", "Новости для хакеров"},
		{"Product Hunt", "https://producthunt.com", "Новые продукты и стартапы"},
		{"Dribbble", "https://dribbble.com", "Портфолио дизайнеров"},
		{"Behance", "https://behance.net", "Творческие проекты Adobe"},
		{"CodePen", "https://codepen.io", "Песочница для фронтенда"},
		{"JSFiddle", "https://jsfiddle.net", "Песочница для JavaScript"},
		{"AWS", "https://aws.amazon.com", "Облачные сервисы Amazon"},
		{"Docker Hub", "https://hub.docker.com", "Container Registry"},
		{"NPM", "https://npmjs.com", "Пакетный менеджер Node.js"},
		{"Go Playground", "https://go.dev/play", "Онлайн-песочница для Go"},
		{"Rust Playground", "https://play.rust-lang.org", "Онлайн-песочница для Rust"},
		{"LeetCode", "https://leetcode.com", "Задачи по алгоритмам"},
		{"HackerRank", "https://hackerrank.com", "Практика программирования"},
		{"Codewars", "https://codewars.com", "Задачи разных уровней"},
		{"FreeCodeCamp", "https://freecodecamp.org", "Бесплатное обучение программированию"},
		{"Udemy", "https://udemy.com", "Онлайн-курсы"},
		{"Coursera", "https://coursera.org", "Университетские курсы онлайн"},
		{"Khan Academy", "https://khanacademy.org", "Бесплатное образование"},
		{"Pluralsight", "https://pluralsight.com", "IT-курсы для профессионалов"},
		{"Frontend Mentor", "https://frontendmentor.io", "Практика фронтенда"},
		{"CSS Tricks", "https://css-tricks.com", "Статьи и уроки по CSS"},
		{"Smashing Magazine", "https://smashingmagazine.com", "Веб-дизайн и разработка"},
		{"A List Apart", "https://alistapart.com", "Веб-стандарты и лучшие практики"},
		{"SitePoint", "https://sitepoint.com", "Статьи для веб-разработчиков"},
		{"DigitalOcean", "https://digitalocean.com", "Облачный хостинг"},
		{"Heroku", "https://heroku.com", "Платформа для деплоя"},
		{"Netlify", "https://netlify.com", "Хостинг для фронтенда"},
		{"Vercel", "https://vercel.com", "Платформа для Next.js"},
		{"Firebase", "https://firebase.google.com", "Backend-as-a-Service от Google"},
		{"Supabase", "https://supabase.com", "Open Source альтернатива Firebase"},
		{"PostgreSQL", "https://postgresql.org", "Мощная реляционная БД"},
		{"MongoDB", "https://mongodb.com", "NoSQL документная БД"},
		{"Redis", "https://redis.io", "In-memory хранилище данных"},
		{"Nginx", "https://nginx.org", "Веб-сервер и reverse proxy"},
		{"Apache", "https://apache.org", "HTTP-сервер"},
		{"Node.js", "https://nodejs.org", "JavaScript runtime"},
		{"Python", "https://python.org", "Язык программирования"},
		{"Ruby", "https://ruby-lang.org", "Элегантный язык программирования"},
		{"PHP", "https://php.net", "Серверный язык программирования"},
	}

	totalLinksCreated := 0
	for _, user := range createdUsers {
		linksPerUser := 6
		// Для admin создаем больше ссылок для демонстрации
		if user.Username == "admin" {
			linksPerUser = len(testLinks)
		}

		for i, l := range testLinks {
			if i >= linksPerUser {
				break
			}
			link := &entity.Link{
				UserID:      user.ID,
				Title:       l.title,
				URL:         l.url,
				Description: l.description,
			}
			if err := linkRepo.Create(link); err != nil {
				log.Printf("Ошибка создания ссылки для %s: %v", user.Username, err)
				continue
			}
			totalLinksCreated++
		}
		fmt.Printf("✅ Создано %d ссылок для пользователя %s\n", linksPerUser, user.Username)
	}

	fmt.Printf("\n🎉 Готово! Создано:\n")
	fmt.Printf("   👥 Пользователей: %d\n", len(createdUsers))
	fmt.Printf("   🔗 Ссылок: %d\n\n", totalLinksCreated)
	fmt.Println("📝 Тестовые учетные данные:")
	for _, u := range users {
		fmt.Printf("   Username: %s, Password: %s\n", u.username, u.password)
	}
	fmt.Println("\n💡 Используйте эти данные для входа через POST /api/auth/login")
}
