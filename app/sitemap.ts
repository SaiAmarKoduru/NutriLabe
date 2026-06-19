import { MetadataRoute } from 'next';
import { createSessionClient, DATABASE_ID, POSTS_COLLECTION_ID } from "./lib/webwrite/config";
import { Query } from 'node-appwrite';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Get all published blog posts
    const { databases } = createSessionClient();
    const posts = await databases.listDocuments(
        DATABASE_ID,
        POSTS_COLLECTION_ID,
        [Query.equal('published', true)]
    );

    // Create blog post URLs
    const blogUrls = posts.documents.map((post) => ({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/blog/${post.slug}`,
        lastModified: new Date(post.$updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7
    }));

    // Static routes
    const routes = [
        {
            url: `${process.env.NEXT_PUBLIC_APP_URL}`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1
        },
        {
            url: `${process.env.NEXT_PUBLIC_APP_URL}/blog`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8
        },
        {
            url: `${process.env.NEXT_PUBLIC_APP_URL}/generator`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.5
        },
        {
            url: `${process.env.NEXT_PUBLIC_APP_URL}/ingredient-builder`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.5
        },

        // Add other static routes here
    ];

    return [...routes, ...blogUrls];
}


// import { MetadataRoute } from 'next'
 
// export default function sitemap(): MetadataRoute.Sitemap {
//   const baseUrl = 'https://nutrition-label-maker.vercel.app'
  
//   return [
//     {
//       url: baseUrl,
//       lastModified: new Date(),
//       changeFrequency: 'weekly',
//       priority: 1,
//     },
//     {
//       url: `${baseUrl}/generator`,
//       lastModified: new Date(),
//       changeFrequency: 'weekly',
//       priority: 0.9,
//     },
//     {
//       url: `${baseUrl}/ingredient-builder`,
//       lastModified: new Date(),
//       changeFrequency: 'weekly',
//       priority: 0.9,
//     },
//     {
//       url: `${baseUrl}/terms`,
//       lastModified: new Date(),
//       changeFrequency: 'yearly',
//       priority: 0.5,
//     },
//     {
//       url: `${baseUrl}/privacy`,
//       lastModified: new Date(),
//       changeFrequency: 'yearly',
//       priority: 0.5,
//     },
//     {
//       url: `${baseUrl}/cookies`,
//       lastModified: new Date(),
//       changeFrequency: 'yearly',
//       priority: 0.5,
//     },
//   ]
// }
