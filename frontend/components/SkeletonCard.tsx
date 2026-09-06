export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
      {/* Image Skeleton */}
      <div className="h-48 bg-gradient-to-br from-pink-100 to-purple-100 animate-pulse" />
      
      {/* Content Skeleton */}
      <div className="p-5">
        {/* Title and Status Badge */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16 shrink-0" />
        </div>

        {/* Item Code */}
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mb-2" />
        
        {/* Category */}
        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3 mb-4" />

        {/* Price Section */}
        <div className="border-t border-gray-100 pt-4 mt-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
