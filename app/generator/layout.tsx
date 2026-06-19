import { Metadata } from 'next';
import { FileText, Globe, Download, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: {
    default: 'FREE Nutrition Label Generator | Create FDA Labels in Seconds',
    template: '%s | Free Label Generator'
  },
  description: 'Create professional nutrition facts labels 100% FREE! Instant FDA-compliant labels for food products. No signup required, easy to use, download instantly!',
  
  openGraph: {
    type: 'website',
    siteName: 'Nutrition Label Maker',
    title: 'FREE Nutrition Label Generator | Create FDA Labels in Seconds',
    description: 'Create professional nutrition facts labels 100% FREE! Instant FDA-compliant labels for food products. No signup required, easy to use, download instantly!',
  },

  keywords: [
    'free nutrition facts creator',
    'instant label generator',
    'FDA-approved food labels',
    'custom food label maker',
    'nutrition facts label tool',
    'free food label generator',
    'professional label maker',
    'quick nutrition label tool',
    'no registration label maker',
    'downloadable nutrition labels'
]

};

function GeneratorInfo() {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Create Professional Nutrition Labels</h2>
          <p className="text-lg text-gray-600">
            Generate accurate, compliant nutrition labels for your food products in multiple
            international formats with our easy-to-use tool.
          </p>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Globe className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Multiple Formats</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Choose from various international label formats to meet your specific requirements
              and compliance needs.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-600">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                US FDA Format
              </li>
              <li className="flex items-center text-gray-600">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                EU Energy Labels
              </li>
              <li className="flex items-center text-gray-600">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                International Standards
              </li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Sparkles className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Customization</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Customize your labels to match your brand and product requirements while
              maintaining compliance.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-600">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                Serving Size Options
              </li>
              <li className="flex items-center text-gray-600">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                Nutrient Display
              </li>
              <li className="flex items-center text-gray-600">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                Format Selection
              </li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Download className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Export Options</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Download your labels in high-quality formats suitable for both digital use
              and professional printing.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-600">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                High Resolution PNG
              </li>
              <li className="flex items-center text-gray-600">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                Print-Ready Quality
              </li>
              <li className="flex items-center text-gray-600">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                Professional Format
              </li>
            </ul>
          </div>
        </div>

        {/* Usage Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-semibold text-gray-900">Tips for Perfect Labels</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Getting Started</h4>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Choose your preferred label format
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Enter accurate nutrition information
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Review all values before downloading
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Best Practices</h4>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Verify compliance requirements
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Use appropriate serving sizes
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Double-check all measurements
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function GeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <hr className="my-16 border-t border-gray-200" />
      <GeneratorInfo />
    </>
  );
}
