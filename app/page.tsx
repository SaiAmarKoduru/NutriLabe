import Link from 'next/link';
import { ArrowRight, ChefHat, FileText, Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-white to-gray-800 pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Create {' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Nutrition Labels
              </span>{' '}
              for Your Food Products
            </h1>
            <p className="text-xl text-gray-600 mb-12">
             Create detailed and accurate nutrition labels for your recipes or products.
             Pick from various international formats and download them in high resolution.
            </p>

            {/* CTA Cards */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="group flex flex-col justify-between relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div>                  
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white shadow-lg">
                  <ChefHat className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-4">Ingredient Nutrition Builder</h2>
                <p className="text-gray-600 mb-6">
                  Calculate nutrition facts from your ingredients using our USDA database.
                  Perfect for manufacturers and food businesses.
                </p>
                </div>
                <Link href="/ingredient-builder">
                  <Button className="w-full group-hover:bg-green-600 transition-colors">
                    Build from Ingredients
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="group flex flex-col justify-between relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 p-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl text-white shadow-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-4">Direct Nutrition Generator</h2>
                <p className="text-gray-600 mb-6">
                  Already have nutrition information? Generate labels directly by entering
                  your nutrition facts data.
                </p>
                </div>
                <Link href="/generator">
                  <Button className="w-full group-hover:bg-green-600 transition-colors">
                    Create from Values
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Globe className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold">Various Formats</h3>
              </div>
              <p className="text-gray-600">
                Generate labels in US FDA, EU, Canadian, Australian, and Indian formats.
                All compliant with local regulations.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <ChefHat className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold">USDA Database</h3>
              </div>
              <p className="text-gray-600">
                Access comprehensive nutrition data from the USDA database for accurate
                ingredient-based calculations.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Sparkles className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold">Good Quality</h3>
              </div>
              <p className="text-gray-600">
                Download high-resolution labels perfect for packaging, or menus.
                Print-ready quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Create Your Nutrition Label?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Choose the method that works best for you and start generating 
            nutrition labels today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ingredient-builder">
              <Button size="lg" className="min-w-[200px]">
                Create from Ingredients
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/generator">
              <Button size="lg" className="min-w-[200px]">
                Direct Generator
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}