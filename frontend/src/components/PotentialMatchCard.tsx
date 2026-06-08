import React from 'react';

export interface PotentialMatchCardProps {
  itemTitle: string;
  confidenceScore: number;
  matchedTags: string[];
  claimedStatus: boolean;
  onContactOwner: () => void;
}

export const PotentialMatchCard: React.FC<PotentialMatchCardProps> = ({
  itemTitle,
  confidenceScore,
  matchedTags,
  claimedStatus,
  onContactOwner,
}) => {
  // Determine if it's a high confidence match (e.g., over 75%)
  const isHighMatch = confidenceScore > 75;

  return (
    <div
      className={`relative flex flex-col p-5 rounded-2xl bg-gray-900/80 backdrop-blur-sm border-2 transition-all duration-300 hover:shadow-xl ${
        isHighMatch
          ? 'border-emerald-500/50 shadow-emerald-900/20'
          : 'border-gray-800 hover:border-gray-700'
      }`}
    >
      {/* High Match Floating Badge */}
      {isHighMatch && (
        <div className="absolute -top-3 -right-3 px-3 py-1 bg-emerald-500 text-emerald-950 text-xs font-bold uppercase tracking-wider rounded-full shadow-md">
          High Match
        </div>
      )}

      {/* Header: Title and Status */}
      <div className="flex justify-between items-start mb-4 gap-3">
        <h3 className="text-lg font-bold text-white line-clamp-1" title={itemTitle}>
          {itemTitle}
        </h3>
        <span
          className={`shrink-0 px-2 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md ${
            claimedStatus
              ? 'bg-red-500/20 text-red-400 border border-red-500/20'
              : 'bg-green-500/20 text-green-400 border border-green-500/20'
          }`}
        >
          {claimedStatus ? 'Claimed' : 'Available'}
        </span>
      </div>

      {/* Match Score Indicator */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-medium text-gray-400">AI Similarity Score</span>
          <span
            className={`text-sm font-bold ${
              isHighMatch ? 'text-emerald-400' : 'text-yellow-400'
            }`}
          >
            {confidenceScore}%
          </span>
        </div>
        {/* Progress Bar Container */}
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              isHighMatch
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                : 'bg-gradient-to-r from-yellow-600 to-yellow-400'
            }`}
            style={{ width: `${Math.min(Math.max(confidenceScore, 0), 100)}%` }}
          />
        </div>
      </div>

      {/* Matched Tags Section */}
      <div className="mb-6 flex-grow">
        <span className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
          Extracted Tags
        </span>
        <div className="flex flex-wrap gap-2">
          {matchedTags && matchedTags.length > 0 ? (
            matchedTags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 text-xs font-medium bg-gray-800/80 border border-gray-700 text-gray-300 rounded-md"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-600 italic">
              No specific semantic tags matched
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onContactOwner}
        disabled={claimedStatus}
        className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
          claimedStatus
            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 shadow-md shadow-yellow-900/20'
        }`}
      >
        {claimedStatus ? (
          'Item Already Claimed'
        ) : (
          <>
            <span>View Details & Claim</span>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </>
        )}
      </button>
    </div>
  );
};
