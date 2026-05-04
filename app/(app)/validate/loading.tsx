export default function ValidateLoading() {
  return (
    <div className="animate-pulse flex flex-col gap-4">
      <div className="h-8 w-48 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-64 bg-gray-200 rounded mb-6" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-36 bg-gray-200 rounded-xl" />
      ))}
    </div>
  )
}
