export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-semibold">Welcome to your Dashboard!</h2>
                    <p className="text-gray-600 mt-4">
                        Since the blog feature has been removed, you can focus on other parts of the website.
                    </p>
                </div>
            </div>
        </div>
    );
}
