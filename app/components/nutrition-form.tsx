"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { NutritionData } from "../types/nutrition";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const nutritionSchema = z.object({
  servingSize: z.number().min(1, "Required"),
  servingsPerContainer: z.number().min(1, "Required"),
  calories: z.number().min(0),
  totalFat: z.number().min(0),
  saturatedFat: z.number().min(0),
  transFat: z.number().min(0),
  cholesterol: z.number().min(0),
  sodium: z.number().min(0),
  totalCarbohydrates: z.number().min(0),
  dietaryFiber: z.number().min(0),
  sugars: z.number().min(0),
  protein: z.number().min(0),
  vitaminD: z.number().min(0),
  calcium: z.number().min(0),
  iron: z.number().min(0),
  potassium: z.number().min(0),
});

interface NutritionFormProps {
  onSubmit: (data: NutritionData) => void;
}

type FormField = {
  name: keyof NutritionData;
  label: string;
};

const formFields: Record<string, FormField[]> = {
  serving: [
    { name: "servingSize", label: "Serving Size" },
    { name: "servingsPerContainer", label: "Servings Per Container" },
  ],
  mainNutrients: [
    { name: "calories", label: "Calories" },
    { name: "totalFat", label: "Total Fat (g)" },
    { name: "saturatedFat", label: "Saturated Fat (g)" },
    { name: "transFat", label: "Trans Fat (g)" },
    { name: "cholesterol", label: "Cholesterol (mg)" },
    { name: "sodium", label: "Sodium (mg)" },
  ],
  carbs: [
    { name: "totalCarbohydrates", label: "Total Carbohydrates (g)" },
    { name: "dietaryFiber", label: "Dietary Fiber (g)" },
    { name: "sugars", label: "Sugars (g)" },
    { name: "protein", label: "Protein (g)" },
  ],
  vitamins: [
    { name: "vitaminD", label: "Vitamin D (mcg)" },
    { name: "calcium", label: "Calcium (mg)" },
    { name: "iron", label: "Iron (mg)" },
    { name: "potassium", label: "Potassium (mg)" },
  ],
};

export function NutritionForm({ onSubmit }: NutritionFormProps) {
  const form = useForm<NutritionData>({
    resolver: zodResolver(nutritionSchema),
    defaultValues: {
      servingSize: 1,
      servingsPerContainer: 8,
      calories: 150,
      totalFat: 8,
      saturatedFat: 1,
      transFat: 0,
      cholesterol: 0,
      sodium: 100,
      totalCarbohydrates: 20,
      dietaryFiber: 4,
      sugars: 10,
      protein: 5,
      vitaminD: 0,
      calcium: 20,
      iron: 10,
      potassium: 0,
    },
  });

  const renderField = (field: FormField) => (
    <FormField
      key={field.name}
      control={form.control}
      name={field.name}
      render={({ field: formField }) => (
        <FormItem className="space-y-1">
          <FormLabel className="text-sm">{field.label}</FormLabel>
          <FormControl>
            <Input
              type={field.name === "servingSize" || field.name === "servingsPerContainer" ? "text" : "number"}
              min="0"
              step="0.1"
              {...formField}
              onChange={(e) =>
                formField.onChange(
                  field.name === "servingSize" || field.name === "servingsPerContainer"
                    ? e.target.value
                    : parseFloat(e.target.value) || 0
                )
              }
              className="h-8"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-4 border-none">
          <h3 className="font-semibold mb-3">Serving Information</h3>
          <div className="grid grid-cols-2 gap-4">
            {formFields.serving.map((field) => renderField(field))}
          </div>
        </Card>

        <Card className="p-4 border-none">
          <h3 className="font-semibold mb-3">Main Nutrients</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {formFields.mainNutrients.map((field) => renderField(field))}
          </div>
        </Card>

        <Card className="p-4 border-none">
          <h3 className="font-semibold mb-3">Carbohydrates & Protein</h3>
          <div className="grid grid-cols-2 gap-4">
            {formFields.carbs.map((field) => renderField(field))}
          </div>
        </Card>

        <Card className="p-4 border-none">
          <h3 className="font-semibold mb-3">Vitamins & Minerals</h3>
          <div className="grid grid-cols-2 gap-4">
            {formFields.vitamins.map((field) => renderField(field))}
          </div>
        </Card>

        <Button type="submit" className="w-full">
          Generate Label
        </Button>
      </form>
    </Form>
  );
}