# Resep: resource CRUD baru di `main-service` (Go)

Stack: Go 1.25.3, Fiber v3, GORM, PostgreSQL schema `main`.
Contoh yang dipakai di bawah: `Article`. Ganti sesuai kebutuhan.

Rujukan pola terlengkap: `voucher` (paling ringkas) dan `account_type`
(punya PATCH partial + guard relasi).

## Struktur layer

```
routes/ → handlers/ → usecases/ → GORM
```

Tidak ada repository layer, tidak ada DTO package, tidak ada library validasi.
Handler **tidak pernah** menyentuh `*gorm.DB`; usecase **tidak pernah**
menyentuh `fiber.Ctx`.

## Langkah 1 — Entity

`main-service/domain/entities/article.go`

```go
package entities

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ArticleStatus string

const (
	ArticleStatusDraft     ArticleStatus = "Draft"
	ArticleStatusPublished ArticleStatus = "Published"
)

type Article struct {
	ID        uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Title     string         `gorm:"type:varchar(255);not null" json:"title"`
	Body      string         `gorm:"type:text" json:"body"`
	Status    ArticleStatus  `gorm:"type:varchar(50);not null" json:"status"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
```

Aturan:
- PK selalu `uuid` dengan `default:gen_random_uuid()` — dibuat **Postgres**,
  bukan `uuid.New()` di Go. `uuid.New()` tidak pernah dipakai di service ini.
- Soft delete: `DeletedAt gorm.DeletedAt \`gorm:"index" json:"-"\`` kecuali data
  yang harus permanen (contoh: `Transaction` tidak punya).
- Enum: `type XStatus string` + blok `const` di file yang sama.
- Field turunan read-only (hasil subquery): `gorm:"->;column:user_count"`.
- Kuota: `Quota *int` (nil = unlimited) + `UsedQuota int`.
- Relasi belongsTo: `AccountTypeID uuid.UUID` + `AccountType AccountType
  \`gorm:"foreignKey:AccountTypeID" json:"account_type,omitempty"\``.
- JSON tag selalu `snake_case`.

## Langkah 2 — Usecase

`main-service/usecases/article_usecase.go`

```go
package usecases

import (
	"errors"
	"main-service/domain/entities"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ArticleUseCase struct {
	db *gorm.DB
}

func NewArticleUseCase(db *gorm.DB) *ArticleUseCase {
	return &ArticleUseCase{db: db}
}

func (u *ArticleUseCase) CreateArticle(article *entities.Article) error {
	var existing entities.Article
	if err := u.db.Where("title = ?", article.Title).First(&existing).Error; err == nil {
		return errors.New("judul artikel sudah ada")
	}
	return u.db.Create(article).Error
}

func (u *ArticleUseCase) GetAllArticles() ([]entities.Article, error) {
	var articles []entities.Article
	if err := u.db.Order("created_at desc").Find(&articles).Error; err != nil {
		return nil, err
	}
	return articles, nil
}

// Konvensi wajib: not found -> (nil, nil). Handler yang memutuskan 404.
func (u *ArticleUseCase) GetArticleByID(id uuid.UUID) (*entities.Article, error) {
	var article entities.Article
	if err := u.db.First(&article, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &article, nil
}

func (u *ArticleUseCase) UpdateArticle(article *entities.Article) error {
	return u.db.Save(article).Error
}

func (u *ArticleUseCase) DeleteArticle(id uuid.UUID) error {
	return u.db.Delete(&entities.Article{}, "id = ?", id).Error
}
```

Konvensi:
- Konstruktor `NewXUseCase(db *gorm.DB) *XUseCase`, field unexported, tanpa
  interface.
- Butuh gRPC → tambah `authClient *grpc.AuthClient` ke struct + konstruktor
  (pola `MemberUseCase`).
- Butuh usecase lain → inject seperti `MemberUseCase` yang memegang
  `userSubUseCase`.
- Pesan error validasi bisnis: **bahasa Indonesia**. Error teknis: Inggris.
- **Setiap raw table reference wajib berprefix `main.`** — `NamingStrategy`
  hanya berlaku untuk operasi berbasis model:
  ```go
  u.db.Table("main.user_subscriptions").
      Joins("JOIN main.subscription_plans ON main.subscription_plans.id = main.user_subscriptions.subscription_plan_id")
  ```

### Transaksi

Dua gaya hidup berdampingan; pilih salah satu, jangan campur dalam satu fungsi.

```go
// Gaya A — closure (dipakai account_type, subscription_plan delete, worker)
return u.db.Transaction(func(tx *gorm.DB) error {
    if err := tx.Model(&entities.X{}).Where(...).Update(...).Error; err != nil {
        return err
    }
    return tx.Create(y).Error
})

// Gaya B — manual (dipakai jalur pembayaran)
tx := u.db.Begin()
defer func() {
    if r := recover(); r != nil {
        tx.Rollback()
    }
}()
// ... setiap cabang error WAJIB tx.Rollback() sebelum return
return tx.Commit().Error
```

### Guard sebelum hapus

Tiru `DeleteAccountType` / `DeletePlan`:

```go
var activeCount int64
if err := tx.Model(&entities.UserSubscription{}).
    Where("subscription_plan_id = ? AND status = ?", id, entities.SubscriptionStatusActive).
    Count(&activeCount).Error; err != nil {
    return err
}
if activeCount > 0 {
    return errors.New("cannot delete ... because there are still users with active subscriptions")
}
```

### Reservasi kuota atomik

Wajib bila resource punya kuota. Ini pola kanoniknya:

```go
res := tx.Model(&entities.X{}).
    Where("id = ? AND used_quota < quota", id).
    Update("used_quota", gorm.Expr("used_quota + 1"))
if res.Error != nil {
    tx.Rollback()
    return res.Error
}
if res.RowsAffected == 0 {
    tx.Rollback()
    return errors.New("mohon maaf, kuota untuk ... sudah habis")
}
```

Pelepasan: `Where("id = ? AND used_quota > 0")` → `used_quota - 1`.

### Mengganti FK pada entity yang sudah punya relasi ter-preload

```go
existing.SubscriptionPlanID = plan.ID
existing.SubscriptionPlan = entities.SubscriptionPlan{} // WAJIB — kosongkan relasi
tx.Save(&existing)
```

Tanpa baris pengosongan, GORM menulis balik relasi lama.

## Langkah 3 — Handler

`main-service/handlers/article_handler.go`

```go
package handlers

import (
	"main-service/domain/entities"
	"main-service/usecases"

	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type ArticleHandler struct {
	usecase *usecases.ArticleUseCase
}

func NewArticleHandler(usecase *usecases.ArticleUseCase) *ArticleHandler {
	return &ArticleHandler{usecase: usecase}
}

func (h *ArticleHandler) CreateArticle(c fiber.Ctx) error {
	var article entities.Article
	if err := c.Bind().JSON(&article); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}
	if err := h.usecase.CreateArticle(&article); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(article)
}

func (h *ArticleHandler) GetAllArticles(c fiber.Ctx) error {
	articles, err := h.usecase.GetAllArticles()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"results": articles})
}

func (h *ArticleHandler) GetArticleByID(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID format"})
	}
	article, err := h.usecase.GetArticleByID(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if article == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Article not found"})
	}
	return c.JSON(fiber.Map{"results": article})
}

// PATCH partial: baca existing dulu, bind ke struct anonim berfield POINTER,
// terapkan hanya field non-nil. Pola dari account_type_handler.go.
func (h *ArticleHandler) UpdateArticle(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID format"})
	}
	existing, err := h.usecase.GetArticleByID(id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	if existing == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Article not found"})
	}

	var input struct {
		Title *string `json:"title"`
		Body  *string `json:"body"`
	}
	if err := c.Bind().JSON(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}
	if input.Title != nil {
		existing.Title = *input.Title
	}
	if input.Body != nil {
		existing.Body = *input.Body
	}

	if err := h.usecase.UpdateArticle(existing); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(existing)
}

func (h *ArticleHandler) DeleteArticle(c fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid ID format"})
	}
	if err := h.usecase.DeleteArticle(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}
```

Konvensi handler:
- Binding: `c.Bind().JSON(&x)`. (`c.Bind().Body()` hanya dipakai
  `VoucherHandler.CreateVoucher`.)
- Ambil user: `userStr := c.Locals("user_id"); userID := userStr.(string)`;
  `nil` → 401.
- Error format: `fiber.Map{"error": ...}` mentah. **Jangan** pakai
  `utils/response.go` — helper itu hanya dipakai middleware.
- Semua error usecase → **500**. Ini gaya repo saat ini; tidak membedakan
  validasi dari error teknis.
- Status sukses: create **201**, delete **204**, sisanya 200.
- Bentuk body sukses tidak seragam di repo (`{"results":...}` /
  `{"data":...}` / `{"message":...}` / entity telanjang). **Tiru endpoint
  tetangga di domain yang sama**, jangan bikin gaya baru.

## Langkah 4 — Route

Edit `main-service/routes/subscription_routes.go`:

1. Tambah parameter ke signature `SetupSubscriptionRoutes`, **sebelum**
   `authClient`:
   ```go
   articleHandler *handlers.ArticleHandler,
   ```
2. Tambah blok. Harus **setelah** baris deklarasi `adminRole` (baris ~27):
   ```go
   // ==================== Article Routes ====================
   articleGroup := api.Group("/articles")
   articleGroup.Use(middleware.AuthMiddleware(authClient))

   articleGroup.Get("", articleHandler.GetAllArticles)
   articleGroup.Get("/", articleHandler.GetAllArticles)
   articleGroup.Get("/:id", articleHandler.GetArticleByID)
   articleGroup.Post("", adminRole, articleHandler.CreateArticle)
   articleGroup.Post("/", adminRole, articleHandler.CreateArticle)
   articleGroup.Patch("/:id", adminRole, articleHandler.UpdateArticle)
   articleGroup.Delete("/:id", adminRole, articleHandler.DeleteArticle)
   ```

Aturan route:
- `adminRole := middleware.RequireRole("Admin", "SuperAdmin", "Maintainer")`
  dideklarasikan **sekali** di blok account-type dan dipakai ulang di bawahnya
  — urutan deklarasi penting.
- Endpoint tanpa auth → daftarkan di `publicGroup` (`api.Group("/public")`).
- Setiap route didaftarkan **dua kali** (`""` dan `"/"`) agar trailing slash aman.
- Path URL kebab-case.

## Langkah 5 — Wiring + AutoMigrate

Edit `main-service/cmd/api/main.go`:

```go
err := db.AutoMigrate(
    &entities.AccountType{},
    &entities.SubscriptionPlan{},
    &entities.UserSubscription{},
    &entities.Transaction{},
    &entities.Voucher{},
    &entities.Article{},   // <- tambahkan
)
```

```go
articleUseCase := usecases.NewArticleUseCase(db)
articleHandler := handlers.NewArticleHandler(articleUseCase)
```

```go
routes.SetupSubscriptionRoutes(api, accountTypeHandler, subscriptionPlanHandler,
    userSubscriptionHandler, memberHandler, voucherHandler,
    articleHandler,   // <- urutan harus sama dengan signature
    authClient)
```

Index khusus (partial/unique) tidak bisa lewat AutoMigrate — tambahkan
`db.Exec("CREATE ... IF NOT EXISTS ...")` setelahnya, dengan `log.Printf`
warning (bukan `log.Fatal`), meniru `idx_unique_lifetime_plan`.

Env baru → tambah field di `config.Config` + `os.Getenv` (+ `log.Fatal` bila
wajib), lalu ke `main-service/.env`, blok `environment:` di
`docker-compose.dev.yml`/`.prod.yml`, dan `.env.example`.

## Verifikasi

```bash
cd main-service && go vet ./... && go build ./...
```

Dev container `main-service` memakai `air` (poll mode) — perubahan `.go`
memicu rebuild otomatis. Endpoint bisa dicoba lewat gateway:
`http://localhost:8080/api/v1/main/articles`.

## Yang tidak perlu disentuh

`utils/response.go`, `pb/`, `.air.toml`, `proxy.ts`.
