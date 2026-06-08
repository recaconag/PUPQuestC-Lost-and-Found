import React, { useState } from "react";
import { useGetLostItemsQuery } from "../../redux/api/api";
import { Link } from "react-router-dom";
import { FaSearch, FaFilter, FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import type { lostItem } from "../../types/types";
import PaginationNav from "../../components/shared/PaginationNav";
import { formatDate } from "../../utils/formatDate";

const LostItemsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("lostItemName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [limit] = useState(12);

  const { data: lostItems, isLoading } = useGetLostItemsQuery({
    searchTerm,
    page: currentPage,
    limit,
    sortBy,
    sortOrder,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, order] = e.target.value.split("-");
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const totalPages = lostItems?.meta?.totalPage || 1;

  if (isLoading)
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="py-8 px-4 mx-auto max-w-screen-2xl sm:py-6 lg:px-6">
          {/* Header Skeleton */}
          <div className="mx-auto text-center lg:mb-8 mb-6">
            <div className="h-8 bg-gray-700 rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-96 mx-auto animate-pulse"></div>
          </div>

          {/* Search Skeleton */}
          <div className="glass-card rounded-2xl p-6 mb-8">
            <div className="max-w-4xl mx-auto">
              <div className="h-12 bg-gray-700 rounded-xl mb-6 animate-pulse"></div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="h-10 bg-gray-700 rounded-lg flex-1 animate-pulse"></div>
                <div className="h-10 bg-gray-700 rounded-lg w-32 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="container mx-auto px-4">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-gray-800/50 rounded-2xl overflow-hidden shadow-lg animate-pulse backdrop-blur-sm border border-gray-700"
                >
                  <div className="h-56 bg-gray-700"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-700 rounded mb-3"></div>
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-700 rounded"></div>
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                    </div>
                    <div className="h-10 bg-gray-700 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950  pb-16">
      <div className="py-8 px-4 mx-auto max-w-screen-2xl sm:py-6 lg:px-6">
        {/* Header Section */}
        <div className="mx-auto text-center lg:mb-8 mb-6">
          <h2 className="mb-2 text-2xl font-bold gold-text">
            Lost Items
          </h2>
          <p className="text-sm text-gray-400">
            Browse reported lost items within the PUPQC campus.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="max-w-4xl mx-auto">
            {/* Search Bar */}
            <form className="mb-6" onSubmit={handleSearch}>
              <label className="mb-2 text-sm font-medium text-white sr-only">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="search"
                  id="default-search"
                  className="block w-full p-4 ps-12 text-sm text-white border border-gray-700/60 rounded-xl bg-gray-700/70 focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500 placeholder-gray-400 transition-all duration-200 backdrop-blur-sm"
                  placeholder="Search by name, location, or description..."
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                />
                <button
                  type="submit"
                  className="text-white absolute end-3 bottom-2.5 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 focus:ring-4 focus:outline-none focus:ring-yellow-500/50 font-medium rounded-lg text-sm px-6 py-2 transition-all duration-200 shadow-lg hover:shadow-xl border border-red-600/30"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Sort Controls */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <FaFilter className="text-gray-400" />
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={handleSortChange}
                  className="block w-full sm:w-64 p-3 text-sm text-white bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200 cursor-pointer"
                >
                  <option value="lostItemName-asc">Name (A-Z)</option>
                  <option value="lostItemName-desc">Name (Z-A)</option>
                  <option value="date-desc">Date (Newest First)</option>
                  <option value="date-asc">Date (Oldest First)</option>
                  <option value="location-asc">Location (A-Z)</option>
                  <option value="location-desc">Location (Z-A)</option>
                </select>
              </div>

              {/* Clear Search Button */}
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="text-yellow-500 hover:text-yellow-400 text-sm font-medium bg-yellow-900/20 px-4 py-2 rounded-lg hover:bg-yellow-900/40 transition-all duration-200 border border-yellow-700/30"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6">
          <p className="text-center font-medium text-gray-400">
            {searchTerm
              ? `Search results for "${searchTerm}" - ${lostItems?.data?.length || 0
              } items found`
              : `Showing ${lostItems?.data?.length || 0} lost items`}
          </p>
        </div>
      </div>

      {/* card items */}
      <div className="container mx-auto px-4">
        {lostItems?.data?.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-red-900/20 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center border border-red-800/30">
              <FaSearch className="text-gray-400 text-3xl" />
            </div>
            <h3 className="text-xl font-semibold gold-text mb-2">
              {searchTerm ? "No items found" : "No lost items yet"}
            </h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {searchTerm
                ? `No items found for "${searchTerm}". Try adjusting your search terms or browse all items.`
                : "No lost items have been reported yet. Check back later or be the first to report a lost item!"}
            </p>
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border border-red-600/30"
              >
                Clear search and view all items
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 mx-auto grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {lostItems?.data?.map((lostItem: lostItem) => {
              return (
                <div
                  key={lostItem.id}
                  className="group relative bg-gray-800/60 backdrop-blur-sm rounded-xl overflow-hidden border-t-2 border-t-red-700/60 border border-gray-700/60 shadow-sm hover:shadow-[0_4px_14px_rgba(128,0,0,0.25)] hover:scale-[1.02] transition-all duration-200 max-w-sm"
                >
                  <div className="relative overflow-hidden">
                    <div className="h-56 w-full overflow-hidden">
                      <img
                        src={lostItem?.img}
                        className="w-full h-full object-cover"
                        alt={lostItem?.lostItemName}
                        loading="lazy"
                        width={500}
                        height={500}
                        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                          e.currentTarget.src = "/bgimg.png";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                    </div>

                    {lostItem?.isFound ? (
                      <div className="absolute top-3 right-3 bg-emerald-900/60 text-emerald-300 border border-emerald-600/50 px-2.5 py-1 rounded text-xs font-medium shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                        Found
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 bg-red-900/60 text-red-300 border border-red-700/50 px-2.5 py-1 rounded text-xs font-medium">
                        Still Lost
                      </div>
                    )}
                  </div>

                  <div className="p-5 text-white">
                    <h3 className="text-base font-semibold mb-2 text-white line-clamp-1">
                      {lostItem?.lostItemName}
                    </h3>

                    <p className="text-gray-400 text-sm mb-3 line-clamp-2 leading-relaxed">
                      {lostItem?.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <FaCalendarAlt className="text-gray-500 flex-shrink-0 w-3 h-3" />
                        <span className="text-gray-300">
                          {formatDate(lostItem?.date) || "No date reported"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FaMapMarkerAlt className="text-gray-500 flex-shrink-0 w-3 h-3" />
                        <span className="text-gray-300 line-clamp-1">
                          {lostItem.location}
                        </span>
                      </div>
                    </div>

                    <Link to={`/lostItems/${lostItem?.id}`} className="block">
                      <button className="w-full bg-gradient-to-br from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-1 focus:ring-offset-gray-800 text-sm shadow-[0_2px_8px_rgba(128,0,0,0.35)] hover:shadow-[0_4px_14px_rgba(128,0,0,0.5)]">
                        View Details
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PaginationNav
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={lostItems?.meta?.total || 0}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default LostItemsPage;
