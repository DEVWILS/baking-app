package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync/atomic"
	"time"
)

type Product struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Category    string  `json:"category"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Accent      string  `json:"accent"`
}
type OrderItem struct {
	ProductID string `json:"productId"`
	Quantity  int    `json:"quantity"`
}
type Order struct {
	Items     []OrderItem `json:"items"`
	CreatedAt time.Time   `json:"createdAt"`
}

var products = []Product{{"morning-bun", "Cinnamon Morning Bun", "Pastries", "Brown sugar, cinnamon, and orange glaze.", 5.5, "sunrise"}, {"sourdough", "Country Sourdough", "Breads", "Naturally leavened with a crisp, caramel crust.", 8, "wheat"}, {"lemon-tart", "Meyer Lemon Tart", "Tarts", "Silky lemon curd with a toasted almond crust.", 7.5, "lemon"}, {"chocolate-cake", "Dark Chocolate Cake", "Cakes", "Valrhona ganache, espresso, and sea salt.", 9, "cocoa"}, {"focaccia", "Rosemary Focaccia", "Breads", "Olive oil, rosemary, and flaky salt.", 6, "herb"}, {"berry-galette", "Seasonal Berry Galette", "Tarts", "Jammy berries folded into a buttery pastry.", 8.5, "berry"}}
var orderCount uint64

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
func productsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", 405)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}
func ordersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", 405)
		return
	}
	var order Order
	if err := json.NewDecoder(r.Body).Decode(&order); err != nil || len(order.Items) == 0 {
		http.Error(w, "an order needs at least one item", 400)
		return
	}
	for _, item := range order.Items {
		if item.Quantity < 1 {
			http.Error(w, "quantity must be positive", 400)
			return
		}
	}
	order.CreatedAt = time.Now().UTC()
	id := atomic.AddUint64(&orderCount, 1)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"id": id, "order": order})
}
func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/products", productsHandler)
	mux.HandleFunc("/api/orders", ordersHandler)
	log.Println("Crumb & Hearth API listening on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", withCORS(mux)))
}
