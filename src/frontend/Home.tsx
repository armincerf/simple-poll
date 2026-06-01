export function HomePage() {
  return (
    <div class="min-h-screen flex flex-col items-center justify-center gap-6 p-6 bg-gray-950 text-white">
      <h1 class="text-4xl font-bold">Poll App</h1>
      <p class="text-lg text-gray-300">Real-time polling application</p>
      <div class="flex flex-col gap-4 text-center">
        <p class="text-sm text-gray-400">Example routes:</p>
        <div class="space-y-2">
          <a 
            href="/poll/question/1" 
            class="block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
          >
            View Poll Results (Question)
          </a>
          <a 
            href="/poll/answer/1" 
            class="block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition"
          >
            Vote on Poll (Answer)
          </a>
        </div>
      </div>
    </div>
  )
} 