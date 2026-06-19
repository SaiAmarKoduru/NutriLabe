import { Metadata } from 'next';
import { Info, FileText, Globe, Database, Download } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Ingredient Nutrition Builder | Create Labels from Ingredients',
  description: 'Calculate nutrition facts from your ingredients using USDA database. Perfect for food manufacturers and businesses. Supports US FDA, EU, Indian, Canadian, and Australian formats.',

  keywords: [
    'ingredient nutrition calculator',
    'food manufacturing',
    'USDA database',
    'nutrition facts generator',
    'food labeling',
    'nutrition facts',
    'FDA compliant',
    'food nutrition calculator',
    'ingredient calculator',
    'nutrition information',
    'food packaging labels',
    'nutrition analysis',
    'USDA nutrition database',
  ]
};

function RecipeCalculatorInfo() {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Create Nutrition Labels from Your Ingredients</h2>
          <p className="text-lg text-gray-600">
            Calculate accurate nutrition facts using our USDA database integration.
            Perfect for food manufacturers and businesses.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div className="relative">
            <div className="absolute -left-4 top-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">1</span>
            </div>
            <div className="pl-8">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Enter Product Details</h3>
              <p className="text-gray-600 mb-4">
                Start by naming your product and setting the serving information. Our intuitive
                interface makes it easy to input your details accurately.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Product name
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Serving size
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Servings per container
                </li>
              </ul>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-4 top-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">2</span>
            </div>
            <div className="pl-8">
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Add Ingredients</h3>
              <p className="text-gray-600 mb-4">
                Search and add ingredients from our comprehensive USDA database. Get accurate
                nutrition information for each ingredient automatically.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  USDA database search
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Quantity specification
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Auto-calculated nutrition
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* International Standards */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-semibold text-gray-900">International Label Formats</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['US FDA', 'EU', 'Canadian', 'Australian', 'Indian'].map((format) => (
              <div key={format} className="text-center p-4 rounded-lg bg-gray-50">
                <span className="text-gray-700 font-medium">{format}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pro Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Info className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-semibold text-gray-900">Pro Tips</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">For Best Results</h4>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Enter accurate quantities
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Use specific ingredient searches
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Review nutrition facts carefully
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Download Options</h4>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  High-resolution PNG format
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Perfect for packaging
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Print-ready quality
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function RecipeCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <hr className="my-16 border-t border-gray-200" />
      <RecipeCalculatorInfo />
    </>
  );
}
