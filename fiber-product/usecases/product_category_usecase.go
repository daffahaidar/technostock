package usecases

import (
	"fiber-product/domain/entities"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductCategoryUseCase struct {
	db *gorm.DB
}

func NewProductCategoryUseCase(db *gorm.DB) *ProductCategoryUseCase {
	return &ProductCategoryUseCase{db: db}
}

func (u *ProductCategoryUseCase) CreateCategory(category *entities.ProductCategory) error {
	return u.db.Create(category).Error
}

func (u *ProductCategoryUseCase) GetCategoryByID(id uuid.UUID) (*entities.ProductCategory, error) {
	var category entities.ProductCategory
	err := u.db.First(&category, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

func (u *ProductCategoryUseCase) GetAllCategories() ([]entities.ProductCategory, error) {
	var categories []entities.ProductCategory
	err := u.db.Find(&categories).Error
	return categories, err
}

func (u *ProductCategoryUseCase) UpdateCategory(category *entities.ProductCategory) error {
	return u.db.Save(category).Error
}

func (u *ProductCategoryUseCase) DeleteCategory(id uuid.UUID) error {
	// Check if any products use this category
	var count int64
	u.db.Model(&entities.Product{}).Where("category_id = ?", id).Count(&count)
	if count > 0 {
		return gorm.ErrCheckConstraintViolated
	}
	return u.db.Delete(&entities.ProductCategory{}, "id = ?", id).Error
}
