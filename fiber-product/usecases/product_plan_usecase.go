package usecases

import (
	"fiber-product/domain/entities"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProductPlanUseCase struct {
	db *gorm.DB
}

func NewProductPlanUseCase(db *gorm.DB) *ProductPlanUseCase {
	return &ProductPlanUseCase{db: db}
}

func (u *ProductPlanUseCase) CreateProductPlan(plan *entities.ProductPlan) error {
	// Verify category exists
	var category entities.ProductCategory
	if err := u.db.First(&category, "id = ?", plan.CategoryID).Error; err != nil {
		return gorm.ErrRecordNotFound
	}

	return u.db.Create(plan).Error
}

func (u *ProductPlanUseCase) GetProductPlanByID(id uuid.UUID) (*entities.ProductPlan, error) {
	var plan entities.ProductPlan
	err := u.db.Preload("Category").First(&plan, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &plan, nil
}

func (u *ProductPlanUseCase) GetProductPlansByCategoryID(categoryID uuid.UUID) ([]entities.ProductPlan, error) {
	var plans []entities.ProductPlan
	err := u.db.Preload("Category").Where("category_id = ?", categoryID).Find(&plans).Error
	if err != nil {
		return nil, err
	}
	return plans, nil
}

func (u *ProductPlanUseCase) GetProductPlansByCategorySlug(categorySlug string) ([]entities.ProductPlan, error) {
	var category entities.ProductCategory
	if err := u.db.Where("slug = ?", categorySlug).First(&category).Error; err != nil {
		return nil, err
	}
	return u.GetProductPlansByCategoryID(category.ID)
}

func (u *ProductPlanUseCase) GetProductPlanByCategoryAndPlanSlug(categorySlug, planSlug string) (*entities.ProductPlan, error) {
	var category entities.ProductCategory
	if err := u.db.Where("slug = ?", categorySlug).First(&category).Error; err != nil {
		return nil, err
	}
	var plan entities.ProductPlan
	err := u.db.Preload("Category").Where("category_id = ? AND slug = ?", category.ID, planSlug).First(&plan).Error
	if err != nil {
		return nil, err
	}
	return &plan, nil
}

func (u *ProductPlanUseCase) GetAllProductPlans() ([]entities.ProductPlan, error) {
	var plans []entities.ProductPlan
	err := u.db.Preload("Category").Find(&plans).Error
	return plans, err
}

func (u *ProductPlanUseCase) UpdateProductPlan(plan *entities.ProductPlan) error {
	// Verify category exists
	var category entities.ProductCategory
	if err := u.db.First(&category, "id = ?", plan.CategoryID).Error; err != nil {
		return gorm.ErrRecordNotFound
	}

	return u.db.Save(plan).Error
}

func (u *ProductPlanUseCase) DeleteProductPlan(id uuid.UUID) error {
	// Check if any products use this plan
	var count int64
	u.db.Model(&entities.Product{}).Where("plan_id = ?", id).Count(&count)
	if count > 0 {
		return gorm.ErrCheckConstraintViolated
	}
	return u.db.Delete(&entities.ProductPlan{}, "id = ?", id).Error
}
