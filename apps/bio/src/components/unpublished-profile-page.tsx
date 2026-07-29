type UnpublishedProfilePageProps = {
  username: string
}

export function UnpublishedProfilePage({
  username,
}: UnpublishedProfilePageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-orange-50/30 to-white px-4 motion-safe:animate-fadeIn">
      <div className="text-center">
        {/* Status Badge - Prominent placement */}
        <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 shadow-sm motion-safe:hover:scale-105 motion-safe:transition-transform motion-safe:duration-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
          </span>
          <span className="text-sm font-semibold text-orange-700">
            Under Construction
          </span>
        </div>

        {/* Lab Gear Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-8 rounded-full bg-orange-100/80 blur-3xl" />

            {/* Main icon container */}
            <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] border-2 border-orange-200 bg-white shadow-2xl motion-safe:hover:shadow-orange-200/50 motion-safe:transition-shadow motion-safe:duration-500">
              <svg
                aria-label="Lab flask"
                className="h-12 w-12 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <title>Lab flask</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>

              {/* Plus badge - integrated into icon */}
              <div className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-orange-500 shadow-lg motion-safe:animate-pulse motion-reduce:animate-none">
                <svg
                  aria-label="Plus"
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <title>Plus</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Username */}
        <h1 className="mb-3 text-5xl font-bold tracking-tight text-gray-900 text-pretty">
          @{username}
        </h1>

        {/* Message */}
        <p className="mb-4 text-xl text-gray-500">
          This profile is not published yet
        </p>

        {/* CTA */}
        <p className="text-base font-medium text-gray-400">Check back soon…</p>
      </div>
    </div>
  )
}
