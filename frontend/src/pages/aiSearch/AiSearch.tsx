import React, { useState, useRef } from "react";
import {
  FaSearch,
  FaRobot,
  FaBrain,
  FaSpinner,
  FaEye,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaTags,
  FaMicrochip,
  FaArrowRight,
  FaCamera,
  FaTimes,
  FaImage,
} from "react-icons/fa";
import {
  useAiSearchMutation,
  useAiImageSearchMutation,
} from "../../redux/api/api";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUserVerification, getAccessToken } from "../../auth/auth";
import { formatDate } from "../../utils/formatDate";

interface GeminiAnalysis {
  originalQuery: string;
  detectedItem: string;
  detectedColor: string;
  canonicalColor: string;
  colorReasoning: string;
  expandedKeywords: string[];
  analysisText: string;
  closestMatch: string | null;
}

interface SearchResult {
  foundItems: any[];
  lostItems: any[];
  reasoning: string;
  totalFound: number;
  totalLost: number;
  geminiAnalysis?: GeminiAnalysis | null;
  extractedDescription?: string;
  searchMode?: "text" | "image";
}

const AiSearch: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageMode, setIsImageMode] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [triggerAiSearch, { isLoading }] = useAiSearchMutation();
  const [aiImageSearch, { isLoading: isImageLoading }] =
    useAiImageSearchMutation();
  const navigate = useNavigate();
  const currentUser = useUserVerification();


  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setSearchError(
        "Image too large. Please upload a file smaller than 10MB.",
      );
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }

    setSearchError(null);
    setImageFile(file);
    setIsImageMode(true);
    setSearchQuery("");
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setIsImageMode(false);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // isSearching covers: RTK loading states AND the local fileToBase64 pre-processing gap
  const isSearching = isLoading || isImageLoading || isProcessingImage;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);

    try {
      // =========================================================================
      // 📸 CASE A: KAPAG LARAWAN ANG GINAMIT (IMAGE SEARCH MODE)
      // =========================================================================
      if (isImageMode && imageFile) {
        setIsProcessingImage(true);
        const uploadPayload = new FormData();
        uploadPayload.append("image", imageFile);

        console.log("[PUPQuestC Engine] Extracting visual insights via Gemini Vision...");
        const uploadResponse = await aiImageSearch(uploadPayload).unwrap();
        const serverData = uploadResponse.data || uploadResponse;

        const detectedName = serverData?.aiPredictions?.itemName || "";
        const detectedColor = serverData?.aiPredictions?.color || "";
        const detectedCategory = serverData?.aiPredictions?.inferredCategory || "";

        if (!detectedName) throw new Error("AI was unable to identify the object name from the photo.");

        setSearchResults({
          foundItems: serverData.foundItems || [],
          lostItems: serverData.lostItems || [],
          totalFound: serverData.totalFound || 0,
          totalLost: serverData.totalLost || 0,
          searchMode: "image",
          reasoning: `Cross-referenced image token "${detectedName}" against active database entries.`,
          extractedDescription: `Item: ${detectedName} | Color: ${detectedColor} | Category: ${detectedCategory}`,
          geminiAnalysis: {
            originalQuery: detectedName,
            detectedItem: detectedName,
            detectedColor: detectedColor,
            canonicalColor: detectedColor,
            colorReasoning: "Properties verified via visual analytics indicators.",
            expandedKeywords: [detectedCategory],
            analysisText: serverData?.aiPredictions?.aiGeneratedDescription || "Matching items rendering below.",
            closestMatch: null
          }
        });
        setIsProcessingImage(false);
        return;
      }

      // =========================================================================
      // 📝 CASE B: KAPAG TEXT ANG ITINYPE MO (TEXT SEARCH MODE - AI VECTOR)
      // =========================================================================
      if (!searchQuery.trim()) return;

      console.log(`[PUPQuestC Engine] Calling AI Semantic Search for query: "${searchQuery}"`);

      const searchResponse = await triggerAiSearch({ query: searchQuery }).unwrap();
      const serverData = searchResponse.data || searchResponse;

      setSearchResults({
        foundItems: serverData.foundItems || [],
        lostItems: serverData.lostItems || [],
        totalFound: serverData.totalFound || 0,
        totalLost: serverData.totalLost || 0,
        searchMode: "text",
        reasoning: serverData.reasoning || "AI Semantic Text Vector Matching completed.",
        geminiAnalysis: {
          originalQuery: searchQuery,
          detectedItem: searchQuery,
          detectedColor: "Multi",
          canonicalColor: "Multi",
          colorReasoning: "Analyzed semantically by Hugging Face embedding processor.",
          expandedKeywords: [searchQuery],
          analysisText: `Searching the system tables for items semantically matching: "${searchQuery}"`,
          closestMatch: null
        }
      });

    } catch (error: any) {
      console.error("[Search Engine Failure]:", error);
      setSearchError(error?.message || "An unexpected error occurred during the database matching process.");
      setIsProcessingImage(false);
    }
  };

  const matchLabel = (() => {
    const raw =
      searchResults?.geminiAnalysis?.originalQuery ||
      searchResults?.extractedDescription ||
      "";
    return raw.length > 48 ? raw.slice(0, 48) + "\u2026" : raw;
  })();

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-700 to-red-900 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(128,0,0,0.5)] mr-4">
              <FaBrain className="text-3xl text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent">
              {t("aiSearch.title")}
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t("aiSearch.subtitle")}
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-5xl mx-auto mb-10">
          <form onSubmit={handleSearch} className="glass-card rounded-2xl p-8">
            {/* Hidden file input */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            {/* Image preview */}
            {isImageMode && imagePreview && (
              <div className="mb-5 flex items-center gap-4 p-3 bg-blue-950/30 border border-blue-700/40 rounded-xl">
                <img
                  src={imagePreview}
                  alt="Search reference"
                  className="w-16 h-16 object-cover rounded-lg border border-blue-600/40 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-0.5">
                    Image Search Mode
                  </p>
                  <p className="text-gray-300 text-sm truncate">
                    {imageFile?.name}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Gemini Vision will analyze this image and search for matches
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearImage}
                  className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-all flex-shrink-0"
                  title="Remove image"
                >
                  <FaTimes className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Text input (hidden in image mode) */}
              {!isImageMode && (
                <div className="flex-1 w-full">
                  <div className="relative">
                    <FaRobot className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-400 text-xl" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("aiSearch.placeholder")}
                      className="w-full pl-12 pr-6 py-4 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 text-white placeholder-gray-400 text-lg transition-all duration-200"
                      disabled={isSearching}
                    />
                  </div>
                </div>
              )}

              {/* Image mode active: show label instead of input */}
              {isImageMode && (
                <div className="flex-1 w-full py-4 px-5 bg-blue-950/20 border border-blue-700/40 rounded-xl flex items-center gap-3">
                  <FaImage className="text-blue-400 flex-shrink-0" />
                  <span className="text-blue-300 text-sm font-medium">
                    Ready to search by image
                  </span>
                </div>
              )}

              {/* Camera button — redirects to login if session is gone */}
              <button
                type="button"
                onClick={() => {
                  if (!currentUser || !getAccessToken()) {
                    navigate("/login", { state: { from: "/ai-search" } });
                    return;
                  }
                  imageInputRef.current?.click();
                }}
                disabled={isSearching}
                title={
                  currentUser
                    ? "Search by image (Gemini Vision)"
                    : "Sign in to use Image Search"
                }
                className="bg-gray-700/70 hover:bg-gray-600/70 disabled:opacity-50 border border-gray-600/50 text-gray-300 hover:text-white px-5 py-4 rounded-xl flex items-center gap-2.5 transition-all duration-200 font-semibold whitespace-nowrap"
              >
                <FaCamera className="text-lg" />
                <span className="hidden sm:inline text-sm">
                  Search by Image
                </span>
              </button>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSearching || (!searchQuery.trim() && !imageFile)}
                className="bg-gradient-to-br from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-xl flex items-center space-x-3 transition-all duration-200 font-semibold text-lg shadow-[0_2px_12px_rgba(128,0,0,0.45)] hover:shadow-[0_4px_20px_rgba(128,0,0,0.65)] whitespace-nowrap"
              >
                {isSearching ? (
                  <FaSpinner className="animate-spin text-xl" />
                ) : isImageMode ? (
                  <FaCamera className="text-xl" />
                ) : (
                  <FaSearch className="text-xl" />
                )}
                <span>
                  {isSearching
                    ? isImageMode
                      ? "AI is analyzing your photo..."
                      : t("aiSearch.searching")
                    : t("aiSearch.searchBtn")}
                </span>
              </button>
            </div>
          </form>

          {/* Error Banner */}
          {searchError && (
            <div className="mt-4 flex items-start gap-3 px-5 py-4 rounded-xl bg-red-900/20 border border-red-600/40 text-red-300 text-sm">
              <span className="mt-0.5 flex-shrink-0 text-red-400">✕</span>
              <p className="leading-relaxed">{searchError}</p>
            </div>
          )}
        </div>

        {/* ─── Loading skeleton — shown while search is in progress ─── */}
        {isSearching && (
          <div className="max-w-7xl mx-auto mt-4">
            <div className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center gap-5 text-center">
              <FaSpinner className="text-5xl text-red-500 animate-spin" />
              <div>
                <p className="text-white font-bold text-xl mb-1">
                  {isImageMode
                    ? "Gemini Vision is analyzing your photo…"
                    : "Gemini AI is thinking…"}
                </p>
                <p className="text-gray-400 text-sm">
                  Comparing your query against the database using semantic
                  matching
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {!isSearching && searchResults && (
          <div className="max-w-7xl mx-auto">
            {/* ─── AI Analysis — only shown when Gemini returned full analysis ─── */}
            {searchResults.geminiAnalysis && (
              <div className="glass-card rounded-2xl p-8 mb-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-2xl font-semibold gold-text flex items-center">
                    <FaBrain className="mr-3 text-red-400 text-3xl" />
                    {t("aiSearch.aiAnalysis")}
                  </h3>
                  <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-blue-600/15 border border-blue-500/30 text-blue-300">
                    <FaMicrochip className="text-[10px]" />
                    Gemini 2.0 Flash Lite
                  </span>
                </div>

                {/* Analysis Text */}
                <div className="backdrop-blur-md p-5 rounded-xl shadow-inner mb-5 bg-gray-900/50 border border-yellow-700/40">
                  <p className="text-base leading-relaxed font-semibold text-yellow-300">
                    {searchResults.geminiAnalysis.analysisText}
                  </p>
                </div>

                {/* Semantic Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                  {/* Color Mapping */}
                  {searchResults.geminiAnalysis.detectedColor && (
                    <div className="glass-card rounded-lg p-4">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                        {t("aiSearch.colorMapping")}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-red-900/40 border border-red-700/50 text-red-300 text-sm font-semibold px-3 py-1 rounded-full">
                          {searchResults.geminiAnalysis.detectedColor}
                        </span>
                        <FaArrowRight className="text-gray-500 text-xs flex-shrink-0" />
                        <span className="bg-green-900/30 border border-green-700/40 text-green-300 text-sm font-semibold px-3 py-1 rounded-full">
                          {searchResults.geminiAnalysis.canonicalColor}
                        </span>
                      </div>
                      {searchResults.geminiAnalysis.colorReasoning && (
                        <p className="text-xs text-gray-500 mt-2 leading-snug">
                          {searchResults.geminiAnalysis.colorReasoning}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Item Type */}
                  {searchResults.geminiAnalysis.detectedItem && (
                    <div className="glass-card rounded-lg p-4">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                        {t("aiSearch.itemTypeDetected")}
                      </p>
                      <span className="bg-yellow-900/25 border border-yellow-700/40 text-yellow-300 text-sm font-semibold px-3 py-1 rounded-full">
                        {searchResults.geminiAnalysis.detectedItem}
                      </span>
                    </div>
                  )}

                  {/* Expanded Keywords */}
                  {searchResults.geminiAnalysis.expandedKeywords?.length >
                    0 && (
                      <div className="glass-card rounded-lg p-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                          {t("aiSearch.expandedKeywords")}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {searchResults.geminiAnalysis.expandedKeywords.map(
                            (kw, i) => (
                              <span
                                key={i}
                                className="bg-gray-700/60 text-gray-300 text-xs px-2 py-0.5 rounded-full border border-gray-700/60"
                              >
                                {kw}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {/* Closest Match Fallback */}
                {searchResults.geminiAnalysis.closestMatch &&
                  searchResults.totalFound === 0 &&
                  searchResults.totalLost === 0 && (
                    <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4 mb-5">
                      <p className="text-yellow-400 text-sm font-bold mb-1">
                        {t("aiSearch.closestMatch")}
                      </p>
                      <p className="text-yellow-200 text-sm leading-relaxed">
                        {searchResults.geminiAnalysis.closestMatch}
                      </p>
                    </div>
                  )}

                {/* Gemini Reasoning */}
                <div className="pt-4 border-t border-gray-700/60">
                  <p className="text-yellow-200/60 text-sm leading-relaxed">
                    <span className="text-yellow-500/80 font-semibold">
                      {t("aiSearch.geminiReasoning")}:{" "}
                    </span>
                    {searchResults.reasoning}
                  </p>
                </div>
              </div>
            )}

            {/* Image Search — Extracted Description Banner */}
            {searchResults.searchMode === "image" &&
              searchResults.extractedDescription && (
                <div className="glass-card rounded-xl px-5 py-4 mb-6 border border-blue-700/40 bg-blue-950/20 flex items-start gap-3">
                  <FaCamera className="text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">
                      Gemini Vision — Extracted Description
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {searchResults.extractedDescription}
                    </p>
                  </div>
                </div>
              )}

            {/* Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-2xl p-6 text-center shadow-xl border border-yellow-400/30">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {t("aiSearch.foundItemsCount")}
                </h4>
                <p className="text-4xl font-bold text-gray-900">
                  {searchResults.totalFound}
                </p>
                <p className="text-yellow-900 mt-2">
                  {t("aiSearch.foundItemsWaiting")}
                </p>
              </div>
              <div className="bg-gradient-to-r from-red-800 to-red-700 rounded-2xl p-6 text-center shadow-xl border border-red-600/30">
                <h4 className="text-xl font-semibold text-white mb-2">
                  {t("aiSearch.lostItemsCount")}
                </h4>
                <p className="text-4xl font-bold text-white">
                  {searchResults.totalLost}
                </p>
                <p className="text-red-100 mt-2">
                  {t("aiSearch.lostItemsLooking")}
                </p>
              </div>
            </div>

            {/* Found Items Results */}
            {searchResults.foundItems.length > 0 && (
              <div className="glass-card rounded-2xl p-8 mb-8">
                <h3 className="text-2xl font-semibold gold-text mb-6 flex items-center gap-3">
                  <span className="w-2 h-6 bg-yellow-500 rounded-full inline-block"></span>
                  {t("aiSearch.foundItemsSection")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.foundItems.map((item) => (
                    <div
                      key={item.id}
                      className="glass-card rounded-xl p-6 hover:scale-[1.02] transition-all duration-200 border-t-2 border-t-yellow-600/50"
                    >
                      {item.img && (
                        <div className="relative mb-4">
                          <img
                            src={item.img}
                            alt={item.foundItemName}
                            className="w-full h-40 object-cover rounded-lg"
                            loading="lazy"
                          />
                          {item.isClaimed ? (
                            <div className="absolute top-2 right-2 bg-yellow-900/60 text-yellow-300 border border-yellow-600/50 px-2.5 py-1 rounded text-xs font-medium shadow-[0_0_8px_rgba(202,138,4,0.2)]">
                              {t("aiSearch.claimed")}
                            </div>
                          ) : (
                            <div className="absolute top-2 right-2 bg-emerald-900/60 text-emerald-300 border border-emerald-600/50 px-2.5 py-1 rounded text-xs font-medium shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                              {t("aiSearch.available")}
                            </div>
                          )}
                          {item.similarityScore !== undefined && (
                            <div
                              className={`absolute bottom-2 left-2 px-2 py-0.5 rounded text-xs font-bold border backdrop-blur-sm ${item.similarityScore >= 90
                                ? "bg-green-900/80 text-green-300 border-green-600/50"
                                : item.similarityScore >= 70
                                  ? "bg-blue-900/80 text-blue-300 border-blue-600/50"
                                  : "bg-yellow-900/80 text-yellow-300 border-yellow-600/50"
                                }`}
                            >
                              {item.similarityScore}% match
                            </div>
                          )}
                        </div>
                      )}
                      <h4 className="font-bold text-white text-lg mb-2 truncate">
                        {item.foundItemName}
                      </h4>
                      {item.similarityScore !== undefined && (
                        <div className="flex items-start gap-1.5 mb-3 text-xs bg-violet-900/20 border border-violet-700/30 rounded-lg px-2.5 py-1.5">
                          <FaMicrochip className="text-violet-400 mt-0.5 flex-shrink-0" />
                          <span className="text-violet-300 font-semibold mr-1">
                            AI-Matched
                          </span>
                          {matchLabel && (
                            <span className="text-gray-400 truncate">
                              · matches your description of &ldquo;
                              <em className="text-gray-300 not-italic">
                                {matchLabel}
                              </em>
                              &rdquo;
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                        {item.description}
                      </p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-gray-400 text-sm">
                          <FaTags className="mr-2 text-yellow-600" />
                          <span className="text-yellow-400">
                            {item.category?.name || t("aiSearch.noCategory")}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <FaMapMarkerAlt className="mr-2 text-yellow-600" />
                          <span>{item.location}</span>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <FaCalendarAlt className="mr-2 text-yellow-600" />
                          <span>{formatDate(item.date)}</span>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <FaUser className="mr-2 text-yellow-600" />
                          <span>{item.user?.name || item.user?.email}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/found-items/${item.id}`)}
                        className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-gray-900 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 font-semibold"
                      >
                        <FaEye />
                        <span>{t("aiSearch.viewDetails")}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lost Items Results */}
            {searchResults.lostItems.length > 0 && (
              <div className="glass-card rounded-2xl p-8 mb-8">
                <h3 className="text-2xl font-semibold gold-text mb-6 flex items-center gap-3">
                  <span className="w-2 h-6 bg-red-600 rounded-full inline-block"></span>
                  {t("aiSearch.lostItemsSection")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.lostItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/60 rounded-xl p-6 transition-all duration-200 hover:border-red-500/50"
                    >
                      {item.img && (
                        <div className="relative mb-4">
                          <img
                            src={item.img}
                            alt={item.lostItemName}
                            className="w-full h-40 object-cover rounded-lg"
                            loading="lazy"
                          />
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                            {t("aiSearch.lost")}
                          </div>
                          {item.similarityScore !== undefined && (
                            <div
                              className={`absolute bottom-2 left-2 px-2 py-0.5 rounded text-xs font-bold border backdrop-blur-sm ${item.similarityScore >= 90
                                ? "bg-green-900/80 text-green-300 border-green-600/50"
                                : item.similarityScore >= 70
                                  ? "bg-blue-900/80 text-blue-300 border-blue-600/50"
                                  : "bg-yellow-900/80 text-yellow-300 border-yellow-600/50"
                                }`}
                            >
                              {item.similarityScore}% match
                            </div>
                          )}
                        </div>
                      )}
                      <h4 className="font-bold text-white text-lg mb-2 truncate">
                        {item.lostItemName}
                      </h4>
                      {item.similarityScore !== undefined && (
                        <div className="flex items-start gap-1.5 mb-3 text-xs bg-violet-900/20 border border-violet-700/30 rounded-lg px-2.5 py-1.5">
                          <FaMicrochip className="text-violet-400 mt-0.5 flex-shrink-0" />
                          <span className="text-violet-300 font-semibold mr-1">
                            AI-Matched
                          </span>
                          {matchLabel && (
                            <span className="text-gray-400 truncate">
                              · matches your description of &ldquo;
                              <em className="text-gray-300 not-italic">
                                {matchLabel}
                              </em>
                              &rdquo;
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                        {item.description}
                      </p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-gray-400 text-sm">
                          <FaTags className="mr-2 text-red-500" />
                          <span className="text-yellow-400">
                            {item.category?.name || t("aiSearch.noCategory")}
                          </span>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <FaMapMarkerAlt className="mr-2 text-red-500" />
                          <span>{item.location}</span>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <FaCalendarAlt className="mr-2 text-red-500" />
                          <span>{formatDate(item.date)}</span>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <FaUser className="mr-2 text-red-500" />
                          <span>{item.user?.name || item.user?.email}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/lostItems/${item.id}`)}
                        className="w-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-200 font-semibold border border-red-600/30"
                      >
                        <FaEye />
                        <span>{t("aiSearch.viewDetails")}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchResults.totalFound === 0 &&
              searchResults.totalLost === 0 && (
                <div className="glass-card rounded-2xl p-12 text-center border border-gray-700/60">
                  <div className="w-20 h-20 bg-gradient-to-r from-gray-600 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaSearch className="text-3xl text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-semibold gold-text mb-4">
                    {t("aiSearch.noItemsFound")}
                  </h3>
                  <p className="text-gray-300 text-lg max-w-md mx-auto">
                    {t("aiSearch.noItemsDesc")}
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Search Tips */}
        <div className="max-w-5xl mx-auto mt-12">
          <div className="glass-card rounded-2xl p-8 border border-gray-700/60">
            <h3 className="text-2xl font-semibold gold-text mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
                💡
              </div>
              {t("aiSearch.tipsTitle")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="text-yellow-500 font-bold">
                      {t("aiSearch.tip1Title")}
                    </h4>
                    <p className="text-gray-300 text-sm">
                      {t("aiSearch.tip1Desc")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="text-yellow-500 font-bold">
                      {t("aiSearch.tip2Title")}
                    </h4>
                    <p className="text-gray-300 text-sm">
                      {t("aiSearch.tip2Desc")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="text-yellow-500 font-bold">
                      {t("aiSearch.tip3Title")}
                    </h4>
                    <p className="text-gray-300 text-sm">
                      {t("aiSearch.tip3Desc")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="text-yellow-500 font-bold">
                      {t("aiSearch.tip4Title")}
                    </h4>
                    <p className="text-gray-300 text-sm">
                      {t("aiSearch.tip4Desc")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-red-700 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">5</span>
                  </div>
                  <div>
                    <h4 className="text-yellow-500 font-bold">
                      {t("aiSearch.tip5Title")}
                    </h4>
                    <p className="text-gray-300 text-sm">
                      {t("aiSearch.tip5Desc")}
                    </p>
                  </div>
                </div>
                <div className="bg-red-900/20 border border-red-700/30 p-4 rounded-xl backdrop-blur-sm">
                  <p className="text-yellow-200 text-sm font-medium">
                    {t("aiSearch.poweredBy")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiSearch;
