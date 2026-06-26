<div align="center">

# 🥗 NutriLabe

### Intelligent Multi-Country Nutrition Label Generator & Food Analysis Platform

Generate regulation-compliant nutrition labels, analyze recipes, detect allergens, classify dietary suitability, visualize nutrition insights, and evaluate food quality — all in one place.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwindcss)
![USDA](https://img.shields.io/badge/USDA-FoodDataCentral-green)

</div>

---

# 🌍 Overview

NutriLabe is a modern web application that helps users generate professional nutrition labels compliant with multiple international food-labeling standards while providing intelligent nutritional analysis.

Instead of manually calculating nutritional values or designing labels, users can either:

- ✍️ Enter nutrition values manually
- 🍲 Build recipes using USDA FoodData Central ingredients

NutriLabe automatically performs calculations, generates accurate labels, analyzes ingredients, detects allergens, classifies dietary suitability, and provides meaningful nutrition insights.

---

# ✨ Features

## 🏷 Multi-Country Nutrition Labels

Generate nutrition labels for multiple regulatory standards.

Supported formats include:

- 🇺🇸 United States (FDA)
- 🇪🇺 European Union
- 🇮🇳 India (FSSAI)
- 🇨🇦 Canada
- 🇦🇺 Australia

---

## 🍲 Intelligent Recipe Builder

Create recipes directly from USDA FoodData Central.

Features include:

- Ingredient search
- USDA nutrition lookup
- Automatic nutrient calculation
- Per-serving nutrition computation
- Editable ingredient quantities
- Recipe summary

---

## 📊 Interactive Nutrition Analytics

Visual nutrition insights including:

- Macro calorie distribution
- Nutrient Daily Value charts
- Calorie summary
- Nutrient breakdown
- Interactive tooltips

---

## ⚠️ Allergen Detection

Automatically detects major food allergens including:

- Gluten
- Milk
- Eggs
- Fish
- Shellfish
- Soy
- Tree Nuts
- Peanuts
- Sesame
- Celery
- Mustard
- Sulphites
- Lupin
- Molluscs

Every detection explains:

- Triggering ingredient
- Matching keyword
- Applicable regulations
- Severity

---

## 🌱 Dietary Classification

Automatically classifies recipes as:

- Vegan
- Vegetarian
- Gluten-Free
- Dairy-Free
- Nut-Free
- Soy-Free

Also detects:

- Contains Meat
- Contains Fish / Seafood

Each classification includes an explanation based on recipe ingredients.

---

## 🎯 Nutrition Quality Score

Evaluates overall nutritional quality using configurable scoring rules.

Includes:

- Animated SVG score gauge
- Letter grade
- Positive factors
- Negative factors
- Improvement suggestions
- Educational disclaimer

---

## 🔍 USDA FoodData Central Integration

Live ingredient lookup using the USDA FoodData Central API.

- Search thousands of ingredients
- Accurate nutrition values
- Automatic scaling
- Foundation & SR Legacy datasets

---

## 🖼 Label Preview

Real-time responsive preview featuring:

- Zoom modal
- PNG export
- Responsive layout
- Country-specific rendering

---

## 🚀 Modern User Experience

- Responsive design
- Loading states
- Toast notifications
- Sticky preview panel
- Interactive charts
- Animated score gauges

---

# 🏗 Project Structure (Core)

```
app/
│
├── generator/
├── ingredient-builder/
│
├── components/
│   ├── nutrition-label/
│   ├── nutrition-score-display.tsx
│   └── ...
│
├── lib/
│   ├── usda.ts
│   ├── allergens.ts
│   ├── dietary-tags.ts
│   ├── nutrition-score.ts
│   └── ...
│
├── types/
└── utils/
```

---

# ⚙ Tech Stack

### Frontend

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

### Charts

- Recharts
- SVG animations

### APIs

- USDA FoodData Central API

### UI

- Lucide Icons
- Responsive Flex/Grid Layout

---

# 🧠 Architecture

NutriLabe follows a modular architecture.

```
USDA API
      │
      ▼
Recipe Builder
      │
      ▼
Nutrition Engine
      │
      ├───────────────┐
      ▼               ▼
Label Generator   Nutrition Analysis
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   Charts      Allergen Engine   Dietary Engine
                                      │
                                      ▼
                         Nutrition Quality Score
```

---

# 🧮 Nutrition Calculation

All ingredient nutrition values are normalized per 100 g.

Formula:

```
Scaled Nutrient =
(Per100g Nutrient × Ingredient Weight) / 100
```

Recipe totals are automatically converted into per-serving nutrition.

---

# 🌍 Regulatory Support

NutriLabe currently supports nutrition labeling standards from:

| Country | Supported |
|----------|-----------|
| 🇺🇸 USA | ✅ |
| 🇪🇺 European Union | ✅ |
| 🇮🇳 India | ✅ |
| 🇨🇦 Canada | ✅ |
| 🇦🇺 Australia | ✅ |

---

# 📈 Roadmap

## ✅ Phase 1

- Nutrition calculations
- Multi-country labels
- Recipe Builder
- Charts
- Zoom Preview
- Export

---

## ✅ Phase 2 (Current)

- Allergen Detection
- Dietary Classification
- Nutrition Quality Score

Upcoming:

- Product Comparison
- Serving Size Scaling
- Transparency Score

---

## 🔮 Planned

- AI Nutrition Assistant
- PDF Export
- Recipe Sharing
- Saved Products
- User Accounts
- Mobile Support

---

# 📚 Data Source

Nutritional information is provided by:

**USDA FoodData Central**

---

# 🤝 Contributing

Contributions, ideas, and feedback are welcome.

Feel free to open an Issue.

---

# 👨‍💻 Developer

**Sai Amar Koduru**

Computer Science Engineering Student

Interested in:

- Full Stack Development
- Artificial Intelligence
- Health Informatics
- Human-Centered Software Engineering

---

<div align="center">

### ⭐ If you found this project interesting, consider giving it a star!

Made with ❤️ using Next.js + TypeScript

</div>
