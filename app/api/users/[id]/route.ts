import { type NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/encrypted-messaging"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = new MongoClient(MONGODB_URI)
    await client.connect()

    const db = client.db()
    const users = db.collection("users")

    const user = await users.findOne({ _id: new ObjectId(params.id) }, { projection: { password: 0, privateKey: 0 } })

    await client.close()

    if (!user) {
      return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 })
  }
}
