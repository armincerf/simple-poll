import { useEffect, useState } from 'preact/hooks'
import QRCode from 'qrcode'

export function QuestionPage({ id }: { id: number }) {
  const [votes, setVotes] = useState<Record<string, number>>({})
  
  useEffect(() => {
    // realtime WebSocket using PartyServer convention
    const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/parties/pollroom/${id}`)
    ws.onmessage = evt => setVotes(JSON.parse(evt.data))
    return () => ws.close()
  }, [id])

  const mobileUrl = `${location.origin}/poll/answer/${id}`
  const [qr, setQr] = useState('')
  
  useEffect(() => {
    QRCode.toDataURL(mobileUrl, { margin: 1 }).then(setQr)
  }, [mobileUrl])

  // fancy bar chart using Tailwind animate utilities
  return (
    <div class="min-h-screen p-8 flex flex-col items-center gap-8 bg-gray-950 text-white">
      <h1 class="text-4xl font-bold">Which option do you prefer?</h1>
      <img class="w-40" src={qr} alt="QR code to vote"/>
      <div class="w-full max-w-xl space-y-4">
        {Object.entries(votes).map(([answer, count]) => (
          <div key={answer}>
            <div class="flex justify-between">
              <span>{answer}</span>
              <span>{count}</span>
            </div>
            <div class="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-emerald-500 animate-[grow_0.5s_ease-out]"
                style={{ width: `${(count / Math.max(...Object.values(votes), 1)) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 