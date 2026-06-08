import type { SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import type { lostItem } from "../../types/types";
import { useGetLostItemsQuery } from "../../redux/api/api";
import { FaCalendarAlt, FaMapMarkerAlt, FaExclamationTriangle } from "react-icons/fa";
import EmptyState from "../shared/EmptyState";
import { formatDate } from "../../utils/formatDate";

const RecentLostItem = () => {
  const { data: lostItems, isLoading } = useGetLostItemsQuery({});

  if (isLoading) {
    return (
      <section className="relative bg-gray-950 py-16 overflow-hidden">
        <div className="relative px-4 mx-auto max-w-7xl">
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl overflow-hidden border border-gray-700/60 bg-gray-800/60">
                <div className="h-56 bg-gray-700" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-600 rounded w-3/4" />
                  <div className="h-4 bg-gray-600 rounded w-full" />
                  <div className="h-4 bg-gray-600 rounded w-2/3" />
                  <div className="h-9 bg-gray-600 rounded-lg mt-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-gray-950 py-16 overflow-hidden">

      <div className="relative px-4 mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="text-center mb-14">
          <h2 className="mb-4 text-3xl md:text-4xl font-bold gold-text">
            Recent{" "}
            <span className="bg-gradient-to-r from-red-700 to-yellow-500 bg-clip-text text-transparent">
              Lost Items
            </span>
          </h2>

          <p className="text-gray-400 text-lg">
            Browse reported lost items within the PUPQC campus.
          </p>
        </div>

        {/* EMPTY STATE */}
        {lostItems?.data?.length === 0 && (
          <EmptyState
            icon={<FaExclamationTriangle className="w-full h-full" />}
            title="No Lost Items Reported"
            description="No lost items have been reported yet. If you've lost something on campus, be the first to report it."
          />
        )}

        {/* GRID */}
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {lostItems?.data?.slice(0, 8).map((item: lostItem) => (

            <div
              key={item?.id}
              className="group relative bg-gray-800/60 backdrop-blur-sm rounded-xl overflow-hidden border-t-2 border-t-red-700/60 border border-gray-700/60 shadow-sm hover:shadow-[0_4px_14px_rgba(128,0,0,0.25)] hover:scale-[1.02] transition-all duration-200"
            >

              {/* IMAGE */}
              <div className="relative h-56 overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  src={item?.img || "/bgimg.png"}
                  loading="lazy"
                  onError={(e: SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.src = "/bgimg.png";
                  }}
                  alt={item?.lostItemName}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {/* STATUS */}
                {item?.isFound ? (
                  <div className="absolute top-3 right-3 bg-emerald-900/60 text-emerald-300 border border-emerald-600/50 px-2.5 py-1 rounded text-xs font-medium shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                    Found
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 bg-red-900/60 text-red-300 border border-red-700/50 px-2.5 py-1 rounded text-xs font-medium">
                    Still Lost
                  </div>
                )}
              </div>

              {/* CONTENT */}
              <div className="p-5 text-white">

                <h3 className="text-base font-semibold mb-2 line-clamp-1">
                  {item?.lostItemName}
                </h3>

                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {item?.description}
                </p>

                {/* META */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <FaCalendarAlt className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="text-gray-200">
                      {formatDate(item?.date) || "No date"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-400">
                    <FaMapMarkerAlt className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span className="text-gray-200 line-clamp-1">
                      {item?.location}
                    </span>
                  </div>
                </div>

                {/* BUTTON */}
                <Link to={`/lostItems/${item?.id}`}>
                  <button className="w-full bg-gradient-to-br from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-medium py-2.5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500/70 text-sm shadow-[0_2px_8px_rgba(128,0,0,0.35)] hover:shadow-[0_4px_14px_rgba(128,0,0,0.5)]">
                    View Details
                  </button>
                </Link>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default RecentLostItem;