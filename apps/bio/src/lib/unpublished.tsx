export function UnpublishedProfilePage({ username }: { username: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-zinc-50 p-8 text-center">
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          @{username} is not published yet
        </h1>
        <p className="text-zinc-600">
          This bio page exists but hasn&apos;t been published.
        </p>
      </div>
    </div>
  )
}
