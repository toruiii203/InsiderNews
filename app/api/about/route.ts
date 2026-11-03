export const runtime = 'edge'

import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/session"
import { queryOne } from "@/lib/db"

export async function GET() {
  try {
    const about = await queryOne(
      "SELECT * FROM about_content WHERE id = 1 LIMIT 1;"
    )
    return NextResponse.json({ about })
  } catch (err: any) {
    console.error("[API About GET] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

    const body = await req.json()
    const about = await queryOne(
      `
      INSERT INTO about_content (id, heading, mission, story, updated_at)
      VALUES (1, $1, $2, $3, NOW())
      ON CONFLICT (id) DO UPDATE SET
        heading = EXCLUDED.heading,
        mission = EXCLUDED.mission,
        story = EXCLUDED.story,
        updated_at = NOW()
      RETURNING *;
      `,
      [body.heading, body.mission, body.story]
    )

    return NextResponse.json({ about })
  } catch (err: any) {
    console.error("[API About PATCH] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
