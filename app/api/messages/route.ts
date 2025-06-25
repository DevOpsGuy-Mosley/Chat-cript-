import { type NextRequest, NextResponse } from "next/server"
import { MongoClient, ObjectId } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/encrypted-messaging"

export async function POST(request: NextRequest) {
  try {
    const { senderId, receiverId, encryptedForSender, encryptedForReceiver } = await request.json()

    if (!senderId || !receiverId || !encryptedForSender || !encryptedForReceiver) {
      return NextResponse.json({ message: "Données manquantes" }, { status: 400 })
    }

    const client = new MongoClient(MONGODB_URI)
    await client.connect()

    const db = client.db()
    const messages = db.collection("messages")

    // 🔐 SYSTÈME DOUBLE CHIFFREMENT: Message chiffré pour l'expéditeur ET le destinataire
    const result = await messages.insertOne({
      senderId: new ObjectId(senderId),
      receiverId: new ObjectId(receiverId),
      encryptedForSender,    // Message chiffré avec la clé publique de l'expéditeur
      encryptedForReceiver,  // Message chiffré avec la clé publique du destinataire
      timestamp: new Date(),
    })

    await client.close()

    return NextResponse.json({ _id: result.insertedId })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 })
  }
}
