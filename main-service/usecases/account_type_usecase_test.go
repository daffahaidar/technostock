package usecases

import (
	"encoding/json"
	"reflect"
	"testing"

	"main-service/domain/entities"
)

func TestParseBenefits(t *testing.T) {
	cases := map[string][]string{
		`["Sinyal harian","Grup Discord"]`: {"Sinyal harian", "Grup Discord"},
		`[]`:                               {},
		``:                                 {},
		`null`:                             {},
		// Baris lama sebelum benefits disimpan sebagai JSON.
		`Sinyal harian, Grup Discord`: {"Sinyal harian", "Grup Discord"},
	}

	for raw, want := range cases {
		if got := parseBenefits(raw); !reflect.DeepEqual(got, want) {
			t.Errorf("parseBenefits(%q) = %#v, want %#v", raw, got, want)
		}
	}
}

// PricingItem menimpa Benefits milik AccountType, jadi field "benefits" di JSON
// harus berupa array — bukan string mentah dari DB.
func TestPricingItemBenefitsIsArray(t *testing.T) {
	item := PricingItem{
		AccountType: entities.AccountType{
			Name:     "Gold",
			Benefits: `["a","b"]`,
		},
		Benefits: []string{"a", "b"},
		Plans:    []entities.SubscriptionPlan{},
	}

	raw, err := json.Marshal(item)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}

	var decoded struct {
		Benefits []string `json:"benefits"`
		Plans    []any    `json:"plans"`
	}
	if err := json.Unmarshal(raw, &decoded); err != nil {
		t.Fatalf("benefits bukan array: %v (%s)", err, raw)
	}
	if !reflect.DeepEqual(decoded.Benefits, []string{"a", "b"}) {
		t.Errorf("benefits = %#v, want [a b]", decoded.Benefits)
	}
	if decoded.Plans == nil {
		t.Error("plans harus array kosong, bukan null")
	}
}
