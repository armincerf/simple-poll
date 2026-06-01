export function AnswerPage({ id }: { id: number }) {
  const already = localStorage.getItem(`poll-${id}-voted`)
  const answers = ['A', 'B', 'C', 'D'] // hard-coded; could be dynamic via DO

  async function vote(answer: string) {
    if (already) return
    await fetch('/api/vote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, answer, session: crypto.randomUUID() }),
    })
    localStorage.setItem(`poll-${id}-voted`, answer)
    location.href = `/poll/question/${id}` // go to projector result
  }

  if (already) location.href = `/poll/question/${id}`

  return (
    <div class="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <h2 class="text-2xl font-semibold mb-4">Choose one:</h2>
      {answers.map(a => (
        <button
          key={a}
          class="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition animate-fade-up"
          onClick={() => vote(a)}
        >
          {a}
        </button>
      ))}
    </div>
  )
} 