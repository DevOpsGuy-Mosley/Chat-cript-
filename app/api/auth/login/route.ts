import { type NextRequest, NextResponse } from "next/server"
import { MongoClient } from "mongodb"
import bcrypt from "bcryptjs"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/encrypted-messaging"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ message: "Nom d'utilisateur et mot de passe requis" }, { status: 400 })
    }

    const client = new MongoClient(MONGODB_URI)
    await client.connect()

    const db = client.db()
    const users = db.collection("users")

    // Find user
    const user = await users.findOne({ username })
    if (!user) {
      await client.close()
      return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 401 })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      await client.close()
      return NextResponse.json({ message: "Mot de passe incorrect" }, { status: 401 })
    }

    await client.close()

    // Return user without password
    return NextResponse.json({
      _id: user._id,
      username: user.username,
      publicKey: user.publicKey,
      privateKey: user.privateKey,
      userKey: user.userKey, // Inclure la clé courte
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 })
  }
}
