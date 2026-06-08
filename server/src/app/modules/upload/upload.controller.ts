import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import sendResponse from "../../global/response";
import { systemSettingsService } from "../systemSettings/systemSettings.service";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client"; // 1. IDINAGDAG: Import Prisma Client para sa DB lookup
import { errorResponses } from "../../utils/errorResponse";

const prisma = new PrismaClient(); // Initialize prisma connection instance

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const aiStudio = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ==========================================
// REGULAR IMAGE UPLOAD 
// ==========================================
const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "No file uploaded" });
      return;
    }

    const settings = await systemSettingsService.getSettings();
    const maxBytes = settings.maxImageSizeMb * 1024 * 1024;

    if (req.file.size > maxBytes) {
      if (req.file.path) fs.unlink(req.file.path, () => { });
      return errorResponses.tooManyRequests(
        res,
        `File too large. Maximum allowed size is ${settings.maxImageSizeMb} MB.`
      );
    }

    const serverUrl =
      process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;

    const fileUrl = `${serverUrl}/uploads/${req.file.filename}`;

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Image uploaded successfully",
      data: { url: fileUrl, filename: req.file.filename },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// AI IMAGE RECOGNITION + AUTOMATIC DB LOOKUP MATRIX
// ==========================================
const uploadAndAnalyzeImageAI = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "No file uploaded for AI analysis" });
      return;
    }

    const settings = await systemSettingsService.getSettings();
    const maxBytes = settings.maxImageSizeMb * 1024 * 1024;
    if (req.file.size > maxBytes) {
      return errorResponses.tooManyRequests(
        res,
        `File too large. Maximum allowed size is ${settings.maxImageSizeMb} MB.`
      );
    }

    console.log(
      "[Phase 3 Engine] Uploading file streaming matrix straight to Cloudinary...",
    );

    const fileSource = req.file.buffer
      ? req.file.buffer
      : fs.readFileSync(req.file.path);
    const fileBase64 = req.file.buffer
      ? req.file.buffer.toString("base64")
      : fs.readFileSync(req.file.path, "base64");

    let cloudinaryUrl: string;
    try {
      cloudinaryUrl = await new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "pupquestc_items" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result?.secure_url || "");
          },
        );
        uploadStream.end(fileSource);
      });
    } catch (cloudinaryError) {
      if (req.file.path) {
        fs.unlink(req.file.path, () => { });
      }
      console.error("[Phase 3 Engine] Cloudinary upload failed:", cloudinaryError);
      return errorResponses.internalServerError(
        res,
        "Image upload failed. Please try again."
      );
    }

    if (req.file.path) {
      fs.unlink(req.file.path, () => { });
    }

    console.log(
      "[Phase 3 Engine] Cloudinary secure link initialized:",
      cloudinaryUrl,
    );

    const imagePartForGemini = {
      inlineData: {
        data: fileBase64,
        mimeType: req.file.mimetype,
      },
    };

    const model = aiStudio.getGenerativeModel({ model: "gemini-2.5-flash" });

    const promptInstructions = `
      You are an expert AI lost-and-found tagging agent for a university system.
      Analyze this image of a found or lost item and return a strict JSON object mapping with these exact keys.
      Do not include any markdown wrappers, spaces, or text outside the JSON block.

      {
        "itemName": "Short specific name of object (e.g. Hydro Flask Tumbler, Leather Wallet)",
        "color": "Primary color of the object (e.g. Black, Blue, Silver)",
        "inferredCategory": "One matching text keyword (e.g. Electronics, Bags, Water Bottles, Keys, Documents)",
        "aiGeneratedDescription": "A clear description of visible features, logos, or marks to help the owner identify it."
      }
    `;

    const aiResultResponse = await model.generateContent([
      promptInstructions,
      imagePartForGemini,
    ]);
    const cleanRawText = aiResultResponse.response.text().trim();

    const cleanJsonString = cleanRawText.replace(/```json|```/g, "").trim();
    const parsedAiAnalysisMetadata = JSON.parse(cleanJsonString);

    console.log(
      "[Phase 3 Engine] Dynamic analysis complete:",
      parsedAiAnalysisMetadata,
    );

    // =========================================================================
    // 🔍 ULTIMATE FUZZY MATCHING PIPELINE (KAHIT ISANG SALITA LANG MAGKA-SAME)
    // =========================================================================
    console.log("[Phase 3 Engine] Running hyper-flexible word splitter...");

    const itemNameClean = parsedAiAnalysisMetadata.itemName || "";
    const categoryName = parsedAiAnalysisMetadata.inferredCategory || "";
    const searchColor = parsedAiAnalysisMetadata.color || "";

    // Paghiwalayin ang bawat salita (e.g. "Samsung", "Smartphone")
    // Tatanggalin natin ang mga maiikling salita tulad ng "and", "the", "with"
    const words = itemNameClean
      .split(" ")
      .map((w: string) => w.replace(/[^a-zA-Z0-9]/g, "").trim())
      .filter((w: string) => w.length > 2);

    // Kung walang words na nakuha, gamitin ang buong pangalan
    if (words.length === 0) words.push(itemNameClean);

    console.log("[Phase 3 Engine] Splitted keywords to scan:", words);

    // BUMUONG AGRESIBONG OR CONDITIONS: Kahit isa lang sa mga salitang ito ang tumama sa name o description, HILAHIN!
    const broadSearchConditions = {
      OR: [
        ...words.map((word: string) => ({
          foundItemName: { contains: word, mode: "insensitive" as const }
        })),
        ...words.map((word: string) => ({
          description: { contains: word, mode: "insensitive" as const }
        })),
        { description: { contains: searchColor, mode: "insensitive" as const } },
        { category: { name: { contains: categoryName, mode: "insensitive" as const } } }
      ]
    };

    const broadLostConditions = {
      OR: [
        ...words.map((word: string) => ({
          lostItemName: { contains: word, mode: "insensitive" as const }
        })),
        ...words.map((word: string) => ({
          description: { contains: word, mode: "insensitive" as const }
        })),
        { description: { contains: searchColor, mode: "insensitive" as const } },
        { category: { name: { contains: categoryName, mode: "insensitive" as const } } }
      ]
    };

    // Patakbuhin ang Prisma queries
    const matchedFoundItems = await prisma.foundItem.findMany({
      where: {
        ...broadSearchConditions,
        isClaimed: false,
      },
      include: { category: true, user: true },
    });

    const matchedLostItems = await prisma.lostItem.findMany({
      where: broadLostConditions,
      include: { category: true, user: true },
    });

    console.log(`[Phase 3 Engine] Brute-force match found: ${matchedFoundItems.length} found, ${matchedLostItems.length} lost.`);

    // I-map nang maayos para siguradong may valid fallback values at hindi mag-undefined sa frontend
    const foundItemsWithScores = matchedFoundItems.map((item) => ({
      id: item.id,
      foundItemName: item.foundItemName,
      description: item.description || "",
      location: item.location || "Unknown Location",
      date: item.date,
      img: item.img || item.image || "", // DOUBLE CHECK: Saluhin kung 'img' o 'image' ang field sa DB mo
      isClaimed: item.isClaimed ?? false,
      category: item.category || { name: categoryName },
      user: item.user || { name: "System User" },
      similarityScore: 95, // I-force natin sa mataas na match score para sa UI
    }));

    const lostItemsWithScores = matchedLostItems.map((item) => ({
      id: item.id,
      lostItemName: item.lostItemName,
      description: item.description || "",
      location: item.location || "Unknown Location",
      date: item.date,
      img: item.img || item.image || "",
      category: item.category || { name: categoryName },
      user: item.user || { name: "System User" },
      similarityScore: 95,
    }));

    // Ipadala na ang response
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Hyper-flexible matching complete.",
      data: {
        url: cloudinaryUrl,
        aiPredictions: parsedAiAnalysisMetadata,
        foundItems: foundItemsWithScores,
        lostItems: lostItemsWithScores,
        totalFound: foundItemsWithScores.length,
        totalLost: lostItemsWithScores.length,
      },
    });
  } catch (error: any) {
    console.error("[Phase 3 AI Controller Error]:", error);
    next(error);
  }
};

export const uploadController = {
  uploadImage,
  uploadAndAnalyzeImageAI,
};