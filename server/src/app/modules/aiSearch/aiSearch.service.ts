import { pipeline } from "@xenova/transformers";
import prisma from "../../config/prisma";

let dbFunctionsInitialized = false;
let isPgVectorAvailable = false;

async function initializeDbSearch() {
  if (dbFunctionsInitialized) return;
  try {
    const vectorCheck = await prisma.$queryRaw<any[]>`
      SELECT 1 FROM pg_extension WHERE extname = 'vector'
    `;
    isPgVectorAvailable = vectorCheck.length > 0;

    if (isPgVectorAvailable) {
      console.log("[aiSearch] pgvector extension detected. Checking and applying vector indexes...");
      
      // Check if foundItems.embedding is still a text/character column
      const columnInfo = await prisma.$queryRawUnsafe<any[]>(`
        SELECT data_type FROM information_schema.columns 
        WHERE table_name = 'foundItems' AND column_name = 'embedding'
      `);
      const isTextType = columnInfo[0]?.data_type === 'text' || columnInfo[0]?.data_type === 'character varying';
      
      if (isTextType) {
        console.log("[aiSearch] Migrating embedding columns to native vector(384) type in DB...");
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "foundItems" ALTER COLUMN embedding TYPE vector(384) USING embedding::vector;
        `);
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "lostItems" ALTER COLUMN embedding TYPE vector(384) USING embedding::vector;
        `);
      }

      // Create HNSW vector index for cosine similarity if not exists
      console.log("[aiSearch] Ensuring HNSW vector indexes exist...");
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS found_items_hnsw_idx ON "foundItems" USING hnsw (embedding vector_cosine_ops);
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS lost_items_hnsw_idx ON "lostItems" USING hnsw (embedding vector_cosine_ops);
      `);
    } else {
      console.log("[aiSearch] pgvector extension not available. Setting up fallback PostgreSQL functions...");
      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION public.json_to_float8_array(json_str text)
        RETURNS float8[] AS $$
          SELECT ARRAY(
            SELECT json_array_elements_text(json_str::json)::float8
          );
        $$ LANGUAGE sql IMMUTABLE;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE FUNCTION public.cosine_similarity(a float8[], b float8[])
        RETURNS float8 AS $$
          SELECT COALESCE(
            SUM(x * y) / (SQRT(SUM(x * x)) * SQRT(SUM(y * y))),
            0
          )::float8
          FROM unnest(a, b) AS t(x, y);
        $$ LANGUAGE sql IMMUTABLE;
      `);
    }
    dbFunctionsInitialized = true;
  } catch (error) {
    console.error("[aiSearch] Failed to initialize DB search helper structures:", error);
  }
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

// 2. TEXT SEARCH — Hugging Face Semantic Text Matching + Keyword Fallback (DB-level computation)
const aiSearchItems = async (searchQuery: string) => {
  console.log("[Hugging Face Semantic Search] User query:", searchQuery);

  try {
    // Siguraduhing handa ang DB vector structures
    await initializeDbSearch();

    // Gawan ng embedding array ang hinahanap ng user
    const queryVector = await generateTextEmbedding(searchQuery);

    let matchedFoundResults: Array<{ id: string; similarityScore: number }> = [];
    let matchedLostResults: Array<{ id: string; similarityScore: number }> = [];
    const keywordQuery = searchQuery.toLowerCase();

    if (isPgVectorAvailable) {
      const vectorStr = `[${queryVector.join(",")}]`;
      matchedFoundResults = await prisma.$queryRawUnsafe<Array<{ id: string; similarityScore: number }>>(
        `
        SELECT * FROM (
          SELECT 
            f.id,
            (CASE 
              WHEN f.embedding IS NULL THEN
                CASE 
                  WHEN (LOWER(f."foundItemName") LIKE $1 OR LOWER(f.description) LIKE $1) THEN 0.50
                  ELSE 0.0
                END
              ELSE
                1 - (f.embedding::vector <=> $2::vector)
            END * 100) as "similarityScore"
          FROM "foundItems" f
          WHERE f."isDeleted" = false AND f."isClaimed" = false
        ) sub
        WHERE sub."similarityScore" >= 35
        ORDER BY sub."similarityScore" DESC
        LIMIT 100
        `,
        `%${keywordQuery}%`,
        vectorStr
      );

      matchedLostResults = await prisma.$queryRawUnsafe<Array<{ id: string; similarityScore: number }>>(
        `
        SELECT * FROM (
          SELECT 
            l.id,
            (CASE 
              WHEN l.embedding IS NULL THEN
                CASE 
                  WHEN (LOWER(l."lostItemName") LIKE $1 OR LOWER(l.description) LIKE $1) THEN 0.50
                  ELSE 0.0
                END
              ELSE
                1 - (l.embedding::vector <=> $2::vector)
            END * 100) as "similarityScore"
          FROM "lostItems" l
          WHERE l."isDeleted" = false AND l."isFound" = false
        ) sub
        WHERE sub."similarityScore" >= 35
        ORDER BY sub."similarityScore" DESC
        LIMIT 100
        `,
        `%${keywordQuery}%`,
        vectorStr
      );
    } else {
      matchedFoundResults = await prisma.$queryRawUnsafe<Array<{ id: string; similarityScore: number }>>(
        `
        SELECT * FROM (
          SELECT 
            f.id,
            (CASE 
              WHEN f.embedding IS NULL THEN
                CASE 
                  WHEN (LOWER(f."foundItemName") LIKE $1 OR LOWER(f.description) LIKE $1) THEN 0.50
                  ELSE 0.0
                END
              ELSE
                public.cosine_similarity(public.json_to_float8_array(f.embedding), $2::float8[])
            END * 100) as "similarityScore"
          FROM "foundItems" f
          WHERE f."isDeleted" = false AND f."isClaimed" = false
        ) sub
        WHERE sub."similarityScore" >= 35
        ORDER BY sub."similarityScore" DESC
        LIMIT 100
        `,
        `%${keywordQuery}%`,
        queryVector
      );

      matchedLostResults = await prisma.$queryRawUnsafe<Array<{ id: string; similarityScore: number }>>(
        `
        SELECT * FROM (
          SELECT 
            l.id,
            (CASE 
              WHEN l.embedding IS NULL THEN
                CASE 
                  WHEN (LOWER(l."lostItemName") LIKE $1 OR LOWER(l.description) LIKE $1) THEN 0.50
                  ELSE 0.0
                END
              ELSE
                public.cosine_similarity(public.json_to_float8_array(l.embedding), $2::float8[])
            END * 100) as "similarityScore"
          FROM "lostItems" l
          WHERE l."isDeleted" = false AND l."isFound" = false
        ) sub
        WHERE sub."similarityScore" >= 35
        ORDER BY sub."similarityScore" DESC
        LIMIT 100
        `,
        `%${keywordQuery}%`,
        queryVector
      );
    }

    const foundIds = matchedFoundResults.map((r) => r.id);
    const lostIds = matchedLostResults.map((r) => r.id);

    const foundItems = foundIds.length > 0
      ? await prisma.foundItem.findMany({
          where: { id: { in: foundIds } },
          include: {
            category: true,
            user: { select: { id: true, name: true, email: true } },
          },
        })
      : [];

    const lostItems = lostIds.length > 0
      ? await prisma.lostItem.findMany({
          where: { id: { in: lostIds } },
          include: {
            category: true,
            user: { select: { id: true, name: true, email: true } },
          },
        })
      : [];

    const foundScoreMap = new Map(matchedFoundResults.map((r) => [r.id, r.similarityScore]));
    const lostScoreMap = new Map(matchedLostResults.map((r) => [r.id, r.similarityScore]));

    const matchedFoundItems = foundItems
      .map((item) => ({
        ...item,
        similarityScore: Math.round(foundScoreMap.get(item.id) ?? 0),
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore);

    const matchedLostItems = lostItems
      .map((item) => ({
        ...item,
        similarityScore: Math.round(lostScoreMap.get(item.id) ?? 0),
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore);

    return {
      foundItems: matchedFoundItems,
      lostItems: matchedLostItems,
      reasoning: `AI Semantic Text Vector Matching active via database level computation`,
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

// 4. Update embedding for a specific item dynamically (supports pgvector & fallback JSON arrays)
export const updateItemEmbedding = async (
  tableName: "lostItems" | "foundItems",
  id: string,
  text: string
): Promise<void> => {
  try {
    // Siguraduhing handa ang DB vector structures at alam natin kung may pgvector
    await initializeDbSearch();
    
    // Gawan ng embedding array ang text ng item
    const vector = await generateTextEmbedding(text);
    const vectorStr = `[${vector.join(",")}]`;

    if (isPgVectorAvailable) {
      await prisma.$executeRawUnsafe(
        `UPDATE "${tableName}" SET embedding = $1::vector WHERE id = $2`,
        vectorStr,
        id
      );
    } else {
      await prisma.$executeRawUnsafe(
        `UPDATE "${tableName}" SET embedding = $1 WHERE id = $2`,
        vectorStr,
        id
      );
    }
    console.log(`[aiSearch] Successfully updated embedding for ${tableName} ID ${id}`);
  } catch (error) {
    console.error(`[aiSearch] Failed to update embedding for ${tableName} ID ${id}:`, error);
  }
};

export const aiSearchService = {
  aiSearchItems,
  aiImageSearch,
  updateItemEmbedding,
};
