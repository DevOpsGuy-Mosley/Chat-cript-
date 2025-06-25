import { type NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/encrypted-messaging"

export async function POST(request: NextRequest) {
  try {
    const { username, password, publicKey, privateKey, userKey } = await request.json()

    if (!username || !password || !publicKey || !privateKey || !userKey) {
      return NextResponse.json({ message: "Tous les champs sont requis" }, { status: 400 })
    }

    const client = new MongoClient(MONGODB_URI)
    await client.connect()

    const db = client.db()
    const users = db.collection("users")

    // Check if user already exists
    const existingUser = await users.findOne({ username })
    if (existingUser) {
      await client.close()
      return NextResponse.json({ message: "Nom d'utilisateur déjà utilisé" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const result = await users.insertOne({
      username,
      password: hashedPassword,
      publicKey,
      privateKey,
      userKey, // Clé courte pour l'utilisateur
      createdAt: new Date(),
    })

    await client.close()

    // Return user without password
    return NextResponse.json({
      _id: result.insertedId,
      username,
      publicKey,
      privateKey,
      userKey, // Inclure la clé courte dans la réponse
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 })
  }
}
