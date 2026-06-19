import Link from "next/link";

const footerLinks = {
  product: [
    { label: "Label Generator", href: "/generator" },
    { label: "Features", href: "/#features" },
  ],

};

export function Footer() {
  return (
<footer className="bg-[#F5F5DC] border-t">
  <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div className="xl:grid xl:grid-cols-3 xl:gap-8">
      {/* Your footer content goes here */}
          {/* Left Column */}
          <div className="space-y-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold">Ingredient Based Nutrition Label Generator</span>
            </Link>
            <p className="text-sm text-black-500">
              Create nutrition labels that comply with international standards.
              Perfect for food manufacturers, restaurants, and health professionals.
            </p>
            <div className="flex space-x-6">
              <a
                href="https://github.com/SaiAmarKoduru" // Replace with your GitHub profile URL
                className="text-gray-400 hover:text-black-500"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/sai-amar-koduru-181264293/" // Replace with your LinkedIn profile URL
                className="text-gray-400 hover:text-gray-500"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 0H4C1.79 0 0 1.79 0 4v16c0 2.21 1.79 4 4 4h16c2.21 0 4-1.79 4-4V4c0-2.21-1.79-4-4-4zM9.5 18H6V9h3.5v9zm-1.75-10.5h-.02c-1.1 0-1.75-.83-1.75-1.75s.83-1.75 1.75-1.75c1.1 0 1.75.83 1.75 1.75s-.83 1.75-1.75 1.75zm10.25 10.5h-3.5v-5c0-1.2-.95-2.25-2.25-2.25s-2.25 1.05-2.25 2.25v5h-3.5V9h3.5v1.25h.04c.47-.72 1.39-1.25 2.25-1.25 1.72 0 3.25 1.48 3.25 3.25v6.75z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Column: Product Section */}
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-xl font-bold">Product</h3>
                <ul role="list" className="mt-4 space-y-4">
                  {footerLinks.product.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-sm text-black-500 hover:text-black-900"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-black-200 pt-8">
          <p className="text-sm text-black-400 xl:text-center">
            &copy; {new Date().getFullYear()} Ingredient Based Nutrition Label Generator by 23 E2.
          </p>
        </div>
      </div>
    </footer>
  );
}
