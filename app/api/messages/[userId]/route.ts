import { type NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/encrypted-messaging"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const url = new URL(request.url)
    const currentUserId = url.searchParams.get("currentUserId")

    if (!currentUserId) {
      return NextResponse.json({ message: "ID utilisateur courant requis" }, { status: 400 })
    }

    const client = new MongoClient(MONGODB_URI)
    await client.connect()

    const db = client.db()
    const messages = db.collection("messages")

    const conversation = await messages
      .find({
        $or: [
          {
            senderId: new ObjectId(currentUserId),
            receiverId: new ObjectId(params.userId),
          },
          {
            senderId: new ObjectId(params.userId),
            receiverId: new ObjectId(currentUserId),
          },
        ],
      })
      .sort({ timestamp: 1 })
      .toArray()

    await client.close()

    return NextResponse.json(conversation)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 })
  }
}
