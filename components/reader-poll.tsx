"use client"

import { useState, useEffect } from "react"
import { Vote, CheckCircle2, AlertCircle } from "lucide-react"

type PollOption = { id: string; label: string }
type PollData = {
  id: string
  question: string
  options: PollOption[]
  counts: Record<string, number>
  totalVotes: number
}

function votedKey(pollId: string) {
  return `tinph_poll_voted_${pollId}`
}

export function ReaderPoll() {
  const [poll, setPoll] = useState<PollData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [voteError, setVoteError] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/poll/active")
        if (!res.ok) throw new Error("failed")
        const data = await res.json()
        setPoll(data.poll ?? null)
        if (data.poll) {
          const voted = localStorage.getItem(votedKey(data.poll.id))
          if (voted) setSelectedOption(voted)
        }
      } catch {
        setPoll(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleVote = async (optionId: string) => {
    if (!poll || selectedOption || submitting) return
    setSubmitting(true)
    setVoteError(false)

    // Optimistic update so it feels instant
    setSelectedOption(optionId)
    setPoll(prev =>
      prev
        ? {
            ...prev,
            counts: { ...prev.counts, [optionId]: (prev.counts[optionId] || 0) + 1 },
            totalVotes: prev.totalVotes + 1,
          }
        : prev
    )
    localStorage.setItem(votedKey(poll.id), optionId)

    try {
      const res = await fetch("/api/poll/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pollId: poll.id, optionId }),
      })

      if (!res.ok) throw new Error("Vote failed to save")
    } catch {
      // The vote didn't actually persist — roll back the optimistic UI
      // instead of showing a false success, and let the person know / retry.
      setSelectedOption(null)
      localStorage.removeItem(votedKey(poll.id))
      setPoll(prev =>
        prev
          ? {
              ...prev,
              counts: { ...prev.counts, [optionId]: Math.max(0, (prev.counts[optionId] || 1) - 1) },
              totalVotes: Math.max(0, prev.totalVotes - 1),
            }
          : prev
      )
      setVoteError(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <section className="py-5 border-y border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="h-24 rounded-lg bg-muted animate-pulse" />
        </div>
      </section>
    )
  }

  if (!poll) return null

  const hasVoted = selectedOption !== null

  return (
    <section className="py-5 border-y border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Vote className="h-5 w-5 text-[#CE1126]" />
            <h2 className="text-lg font-serif font-bold text-foreground">Today's Poll</h2>
          </div>

          <p className="font-medium text-foreground mb-4">{poll.question}</p>

          <div className="flex flex-col gap-2">
            {poll.options.map(option => {
              const count = poll.counts[option.id] || 0
              const pct = poll.totalVotes > 0 ? Math.round((count / poll.totalVotes) * 100) : 0
              const isSelected = selectedOption === option.id

              return (
                <button
                  key={option.id}
                  onClick={() => handleVote(option.id)}
                  disabled={hasVoted}
                  className={`relative w-full text-left rounded-md border overflow-hidden transition-colors
                    ${hasVoted ? "cursor-default" : "cursor-pointer hover:border-[#002D72]"}
                    ${isSelected ? "border-[#002D72]" : "border-border"}
                  `}
                >
                  {hasVoted && (
                    <div
                      className="absolute inset-y-0 left-0 bg-[#002D72]/10 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  )}
                  <div className="relative flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-[#002D72]" />}
                      {option.label}
                    </span>
                    {hasVoted && (
                      <span className="text-muted-foreground text-xs font-semibold tabular-nums">
                        {pct}%
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {hasVoted && (
            <p className="text-xs text-muted-foreground mt-3">
              {poll.totalVotes.toLocaleString()} vote{poll.totalVotes === 1 ? "" : "s"} so far
            </p>
          )}

          {voteError && (
            <div className="flex items-center justify-center gap-2 mt-3 text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-xs">Your vote didn't save — please try again.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
