/**
 * Social Media Post Templates
 * Ready-to-use content templates for quick post creation
 */

export interface PostTemplate {
  id: string;
  name: string;
  description: string;
  category: "engagement" | "promotional" | "educational" | "seasonal" | "behind-the-scenes";
  icon: string;
  platforms: string[];
  caption: string;
  hashtags: string[];
  mediaType?: "image" | "video" | "carousel" | "none";
  bestTime?: string;
  tips?: string[];
}

export const POST_TEMPLATES: PostTemplate[] = [
  {
    id: "engagement-question",
    name: "Ask a Question",
    description: "Boost engagement with a simple question",
    category: "engagement",
    icon: "❓",
    platforms: ["instagram", "facebook", "linkedin", "threads"],
    caption: `Quick question for you:

[INSERT YOUR QUESTION HERE]

Drop your answer in the comments below!`,
    hashtags: ["#question", "#community", "#engagement"],
    bestTime: "morning",
  },
  {
    id: "promo-product-launch",
    name: "Product Launch",
    description: "Announce a new product or feature",
    category: "promotional",
    icon: "🚀",
    platforms: ["instagram", "facebook", "linkedin", "tiktok"],
    caption: `IT'S HERE! 

Introducing [PRODUCT NAME]

Link in bio to shop now!`,
    hashtags: ["#newproduct", "#launch", "#musthave"],
    mediaType: "carousel",
  },
  {
    id: "edu-tip",
    name: "Quick Tip",
    description: "Share valuable advice",
    category: "educational",
    icon: "💡",
    platforms: ["instagram", "linkedin", "threads"],
    caption: `3 [TOPIC] Tips You Need to Know:

1️⃣ [First tip]
2️⃣ [Second tip]
3️⃣ [Third tip]

Save this for later!`,
    hashtags: ["#tips", "#howto", "#learn"],
    mediaType: "carousel",
  },
  {
    id: "bts-team",
    name: "Meet the Team",
    description: "Introduce team members",
    category: "behind-the-scenes",
    icon: "👥",
    platforms: ["instagram", "facebook", "linkedin"],
    caption: `Meet [Name], our [Role]!

[Name] specializes in [expertise].

#MeetTheTeam`,
    hashtags: ["#meettheteam", "#behindthescenes"],
  },
  {
    id: "seasonal-thanks",
    name: "Thank You Post",
    description: "Express gratitude",
    category: "seasonal",
    icon: "🙏",
    platforms: ["instagram", "facebook", "linkedin"],
    caption: `THANK YOU!

We've reached [MILESTONE] and we couldn't have done it without YOU.

#ThankYou #Gratitude`,
    hashtags: ["#thankyou", "#gratitude", "#milestone"],
  },
];

export function getTemplatesByCategory(category: PostTemplate["category"]) {
  return POST_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string) {
  return POST_TEMPLATES.find((t) => t.id === id);
}

export const TEMPLATE_CATEGORIES = [
  { id: "engagement", name: "Engagement", description: "Boost interaction", color: "#8b5cf6" },
  { id: "promotional", name: "Promotional", description: "Drive sales", color: "#f59e0b" },
  { id: "educational", name: "Educational", description: "Share knowledge", color: "#10b981" },
  { id: "behind-the-scenes", name: "Behind the Scenes", description: "Show authenticity", color: "#ec4899" },
  { id: "seasonal", name: "Seasonal", description: "Timely content", color: "#ef4444" },
] as const;
