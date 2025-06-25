import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/encrypted-messaging"

export async function GET() {
  try {
    const client = new MongoClient(MONGODB_URI)
    await client.connect()

    const db = client.db()
    const users = db.collection("users")

    const allUsers = await users
      .find(
        {},
        {
          projection: { password: 0, privateKey: 0 }, // Don't return sensitive data
        },
      )
      .toArray()

    await client.close()

    return NextResponse.json(allUsers)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 })
  }
}
