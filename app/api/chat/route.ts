export const runtime = 'edge'

import { NextRequest, NextResponse } from "next/server"

const systemPrompt = `You are the official AI news assistant for The Insider News Philippines — a premium Philippine news publication. Your role is to:
- Answer questions about Philippine current events, politics, business, culture, and society
- Provide clear, balanced, and factual summaries of news topics
- Help readers understand complex Philippine issues in plain language
- Refer readers to the relevant sections: Nation, Regions, Feature, Metro, Business, Entertainment, International, and Tourism
- Always maintain a professional, informative, and approachable tone
- Keep responses concise (2-4 sentences for simple queries, up to 6 for complex ones)
- If asked about very recent breaking news you don't have data on, acknowledge your knowledge limits gracefully`

async function callGroq(messages: { role: string; content: string }[], apiKey: string) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama3-8b-8192",
      max_tokens: 512,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    }),
  })
  if (!response.ok) throw new Error(`Groq API error: ${response.status}`)
  const data = await response.json()
  return data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response."
}

async function callGemini(messages: { role: string; content: string }[], apiKey: string) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 512 },
      }),
    }
  )
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`)
  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response."
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const groqKey = process.env.GROQ_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY

    if (!groqKey && !geminiKey) {
      return NextResponse.json({
        message: "No API key configured. Please add GROQ_API_KEY or GEMINI_API_KEY to your .env.local file.",
      })
    }

    let message: string
    if (groqKey) {
      message = await callGroq(messages, groqKey)
    } else {
      message = await callGemini(messages, geminiKey!)
    }

    return NextResponse.json({ message, provider: groqKey ? "groq" : "gemini" })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ message: "An error occurred. Please check your API key and try again." })
  }
}
