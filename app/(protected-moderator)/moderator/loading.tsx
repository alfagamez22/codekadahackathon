export default function ModeratorLoading() {
  return (
    <div className="animate-pulse flex flex-col gap-4">
      <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-200 rounded-xl" />
      ))}
    </div>
  )
}
