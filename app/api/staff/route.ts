export const runtime = 'edge'

import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/session"
import { query, queryOne } from "@/lib/db"

export async function GET() {
  try {
    const staff = await query("SELECT * FROM staff ORDER BY display_order ASC;")
    return NextResponse.json({ staff })
  } catch (err: any) {
    console.error("[API Staff GET] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

    const body = await req.json()
    const staff = await queryOne(
      `
      INSERT INTO staff (name, role, bio, photo_url, email, display_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
      `,
      [
        body.name,
        body.role,
        body.bio ?? "",
        body.photo_url ?? "",
        body.email ?? "",
        body.display_order ?? 0,
      ]
    )

    return NextResponse.json({ staff }, { status: 201 })
  } catch (err: any) {
    console.error("[API Staff POST] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Missing staff id" }, { status: 400 })
    }

    const setClauses: string[] = []
    const params: any[] = []
    let idx = 1

    const allowed = ["name", "role", "bio", "photo_url", "email", "display_order"]
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        setClauses.push(`${key} = $${idx++}`)
        params.push(updates[key])
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    params.push(id)
    const sql = `
      UPDATE staff
      SET ${setClauses.join(", ")}
      WHERE id = $${idx}
      RETURNING *;
    `

    const staff = await queryOne(sql, params)
    return NextResponse.json({ staff })
  } catch (err: any) {
    console.error("[API Staff PATCH] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!await verifySession()) return NextResponse.json({ error: "Unauthorised" }, { status: 401 })

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "Missing staff id" }, { status: 400 })
    }

    await query("DELETE FROM staff WHERE id = $1;", [id])
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[API Staff DELETE] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
