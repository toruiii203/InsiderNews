export const runtime = 'edge'

import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

interface Article {
  id: string; title: string; excerpt: string; category: string; author: string; image_url?: string
}

function buildEmailHtml(article: Article, baseUrl: string) {
  const articleUrl = `${baseUrl}/article/${article.id}`
  const imageBlock = article.image_url
    ? `<img src="${article.image_url}" alt="" style="width:100%;max-width:600px;height:220px;object-fit:cover;border-radius:8px;margin-bottom:20px;" />`
    : ""
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
<tr><td style="background:#002D72;padding:20px 32px;">
  <p style="margin:0;color:#FCD116;font-size:22px;font-weight:bold;font-family:Georgia,serif;letter-spacing:1px;">THE INSIDER PH</p>
  <p style="margin:4px 0 0;color:#a0b4d6;font-size:12px;font-family:Arial,sans-serif;">Latest from the Philippines</p>
</td></tr>
<tr><td style="padding:28px 32px;">
  <p style="margin:0 0 6px;color:#CE1126;font-size:12px;font-weight:bold;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:1px;">${article.category}</p>
  ${imageBlock}
  <h1 style="margin:0 0 16px;color:#111827;font-size:24px;line-height:1.35;font-family:Georgia,serif;">${article.title}</h1>
  <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.7;font-family:Arial,sans-serif;">${article.excerpt}</p>
  <a href="${articleUrl}" style="display:inline-block;background:#CE1126;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">Read Full Story →</a>
  <p style="margin:28px 0 0;color:#9ca3af;font-size:12px;font-family:Arial,sans-serif;">By ${article.author}</p>
</td></tr>
<tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;">
  <p style="margin:0;color:#9ca3af;font-size:11px;font-family:Arial,sans-serif;text-align:center;">
    You're receiving this because you subscribed to The Insider PH.<br/>
    <a href="${baseUrl}/unsubscribe" style="color:#6b7280;">Unsubscribe</a>
  </p>
</td></tr>
</table></td></tr></table></body></html>`
}

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-admin-secret")
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }

    const resendKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "newsletter@theinsiderph.com"
    if (!resendKey) return NextResponse.json({ error: "RESEND_API_KEY is not configured." }, { status: 500 })

    const { article }: { article: Article } = await req.json()
    if (!article?.id || !article?.title) {
      return NextResponse.json({ error: "article.id and article.title are required." }, { status: 400 })
    }

    const { data: subscribers, error } = await supabaseAdmin.from("subscribers").select("email")
    if (error) throw error
    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: "No subscribers to notify." })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${req.headers.get("host")}`
    const html = buildEmailHtml(article, baseUrl)
    const subject = `📰 ${article.title}`

    let sent = 0, failed = 0
    const BATCH_SIZE = 50
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE)
      const results = await Promise.allSettled(batch.map(sub =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: fromEmail, to: sub.email, subject, html }),
        })
      ))
      for (const r of results) {
        if (r.status === "fulfilled" && r.value.ok) sent++
        else failed++
      }
    }

    return NextResponse.json({ success: true, sent, failed, total: subscribers.length,
      message: `Sent to ${sent} subscriber${sent !== 1 ? "s" : ""}${failed > 0 ? ` (${failed} failed)` : ""}.` })
  } catch (err) {
    console.error("[Notify] Error:", err)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
