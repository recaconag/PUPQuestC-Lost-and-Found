import { pipeline } from "@xenova/transformers";
import prisma from "../../config/prisma";

// Helper function para kalkulahin ang pagkakahawig ng dalawang vectors (Cosine Similarity)
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 1. Core utility function para gawing AI Vector Numbers ang kahit anong Text Description
export const generateTextEmbedding = async (
  text: string,
): Promise<number[]> => {
  try {
    // Naglo-load ng magaan at libreng open-source model mula sa Hugging Face
    const extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
    const output = await extractor(text, { pooling: "mean", normalize: true });

    // Ibalik ang conversion bilang array ng mga numero (384 dimensions)
    return Array.from(output.data as Float32Array);
  } catch (error) {
    console.error("Failed to generate text embedding vector:", error);
    throw new Error("AI embedding generation pipeline error");
  }
};

// 2. TEXT SEARCH — Hugging Face Semantic Text Matching + Keyword Fallback
const aiSearchItems = async (searchQuery: string) => {
  console.log("[Hugging Face Semantic Search] User query:", searchQuery);

  try {
    // Gawan ng embedding array ang hinahanap ng user
    const queryVector = await generateTextEmbedding(searchQuery);

    // Kukunin nat i-scan ang lahat ng active items sa database
    const foundItems = await prisma.foundItem.findMany({
      where: { isDeleted: false, isClaimed: false },
      include: {
        category: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const lostItems = await prisma.lostItem.findMany({
      where: { isDeleted: false, isFound: false },
      include: {
        category: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Score function para sa pag-calculate ng similarity
    const scoreItem = (item: any) => {
      // Kung walang embedding yung item sa database, gumamit ng basic keyword fallback score
      if (!item.embedding) {
        const keywordQuery = searchQuery.toLowerCase();
        if (
          item.foundItemName?.toLowerCase().includes(keywordQuery) ||
          item.lostItemName?.toLowerCase().includes(keywordQuery) ||
          item.description?.toLowerCase().includes(keywordQuery)
        ) {
          return 50; // Regular text match weight
        }
        return 0;
      }

      // Kalkulahin ang semantic vector score laban sa target query vector
      const itemVector = JSON.parse(item.embedding);
      const score = cosineSimilarity(queryVector, itemVector);
      return Math.round(score * 100); // Gawing Percentage (e.g. 94)
    };

    // I-map at i-sort ang results mula sa pinakamataas na pagkakahawig pababa
    const matchedFoundItems = foundItems
      .map((item) => ({ ...item, similarityScore: scoreItem(item) }))
      .filter((item) => item.similarityScore >= 35) // Threshold limit para iwas maling items
      .sort((a, b) => b.similarityScore - a.similarityScore);

    const matchedLostItems = lostItems
      .map((item) => ({ ...item, similarityScore: scoreItem(item) }))
      .filter((item) => item.similarityScore >= 35)
      .sort((a, b) => b.similarityScore - a.similarityScore);

    return {
      foundItems: matchedFoundItems,
      lostItems: matchedLostItems,
      reasoning: `AI Semantic Text Vector Matching active via all-MiniLM-L6-v2`,
      geminiAnalysis: null,
      totalFound: matchedFoundItems.length,
      totalLost: matchedLostItems.length,
    };
  } catch (error: any) {
    console.error(
      "AI Semantic text search failed, falling back to local database filters:",
      error,
    );

    // Ligtas na fallback query para hindi mag-crash ang page kapag offline ang system module
    const keywordQuery = searchQuery.toLowerCase();
    const fallbackFilter = {
      OR: [
        {
          foundItemName: {
            contains: keywordQuery,
            mode: "insensitive" as const,
          },
        },
        {
          description: { contains: keywordQuery, mode: "insensitive" as const },
        },
      ],
      isDeleted: false,
    };

    const matchedFoundItems = await prisma.foundItem.findMany({
      where: { ...fallbackFilter, isClaimed: false },
      include: {
        category: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      foundItems: matchedFoundItems.map((i) => ({ ...i, similarityScore: 70 })),
      lostItems: [],
      reasoning: "Fallback regular expression indexing matching trigger",
      geminiAnalysis: null,
      totalFound: matchedFoundItems.length,
      totalLost: 0,
    };
  }
};

// 3. IMAGE SEARCH — Placeholder controller endpoint for dashboard routes integrity
const aiImageSearch = async (vector: number[]) => {
  return {
    foundItems: [],
    lostItems: [],
    extractedDescription:
      "Visual embeddings search bypassed for text semantic structure integration mode",
    searchMode: "image" as const,
    totalFound: 0,
    totalLost: 0,
  };
};

export const aiSearchService = {
  aiSearchItems,
  aiImageSearch,
};
