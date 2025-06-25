"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Send, Shield, Lock, Check, Key, AlertTriangle, UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"

interface Message {
  _id: string
  senderId: string
  receiverId: string
  encryptedForSender?: string    // Message chiffré avec la clé publique de l'expéditeur (nouveau format)
  encryptedForReceiver?: string  // Message chiffré avec la clé publique du destinataire (nouveau format)
  encryptedContent?: string      // Ancien format (compatibilité)
  timestamp: Date
}

interface User {
  _id: string
  username: string
  publicKey: number[]
  privateKey: number[]
  userKey: string // Clé courte de l'utilisateur
}

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [decryptedMessages, setDecryptedMessages] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [privateKeyInput, setPrivateKeyInput] = useState("")
  const [showDecryptInput, setShowDecryptInput] = useState(false)
  const [hasValidKey, setHasValidKey] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  // Définir fetchOtherUser et fetchMessages avant les useEffect
  const fetchOtherUser = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const user = await response.json()
        setOtherUser(user)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }, [userId])

  const fetchMessages = useCallback(async () => {
    if (!currentUser) return
    
    try {
      const response = await fetch(`/api/messages/${userId}?currentUserId=${currentUser._id}`)
      if (response.ok) {
        const msgs = await response.json()
        setMessages(msgs)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, userId])

  useEffect(() => {
    const userData = localStorage.getItem("currentUser")
    if (!userData) {
      router.push("/")
      return
    }

    const user = JSON.parse(userData)
    setCurrentUser(user)
    fetchOtherUser()
  }, [fetchOtherUser, router])

  // Effet séparé pour les messages et le polling
  useEffect(() => {
    if (!currentUser) return

    fetchMessages()

    // Polling automatique toutes les 2 secondes pour les nouveaux messages
    const pollInterval = setInterval(() => {
      fetchMessages()
    }, 2000)

    // Nettoyer l'intervalle quand le composant se démonte
    return () => clearInterval(pollInterval)
  }, [fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (messages.length > 0 && currentUser) {
      decryptAllMessages()
    }
  }, [messages, currentUser])

  // Effet pour nettoyer les états quand l'utilisateur change
  useEffect(() => {
    if (currentUser) {
      setHasValidKey(false)
      setPrivateKeyInput("")
      setDecryptedMessages({})
    }
  }, [currentUser])

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer)
    let binary = ""
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  const base64ToArrayBuffer = (base64: string) => {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  const importPublicKey = async (keyData: number[]) => {
    const keyBuffer = new Uint8Array(keyData).buffer
    return await window.crypto.subtle.importKey(
      "spki",
      keyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt"],
    )
  }

  const importPrivateKey = async (keyData: number[]) => {
    const keyBuffer = new Uint8Array(keyData).buffer
    return await window.crypto.subtle.importKey(
      "pkcs8",
      keyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["decrypt"],
    )
  }

  // Vérifier et utiliser la clé courte entrée par l'utilisateur
  const handlePrivateKeySubmit = async () => {
    if (!privateKeyInput.trim()) {
      alert("Veuillez entrer votre clé")
      return
    }

    // Nettoyer la clé saisie (enlever espaces, mettre en majuscules)
    const cleanedKey = privateKeyInput.replace(/\s/g, '').replace(/-/g, '').toUpperCase()
    const expectedKey = currentUser?.userKey?.replace(/-/g, '') || ''

    console.log("🔍 Vérification de la clé:")
    console.log("Clé saisie:", cleanedKey)
    console.log("Clé attendue:", expectedKey)
    console.log("Utilisateur actuel:", currentUser?.username)
    console.log("Clé privée RSA disponible:", !!currentUser?.privateKey)

    // Vérifier que la clé correspond à celle de l'utilisateur
    if (cleanedKey === expectedKey) {
      setHasValidKey(true)
      setShowDecryptInput(false)
      
      // Utiliser la vraie clé privée RSA pour déchiffrer les messages
      if (currentUser?.privateKey) {
        console.log("✅ Clé validée ! Déchiffrement en cours...")
        decryptAllMessagesWithKey(currentUser.privateKey)
      } else {
        console.error("❌ Clé privée RSA manquante !")
        alert("❌ Erreur : Clé privée manquante. Veuillez vous reconnecter.")
      }
    } else {
      alert("❌ Clé incorrecte - vérifiez votre clé personnelle")
      console.log("❌ Clé incorrecte")
    }
  }

  // Fonction pour rechiffrer les messages (les cacher à nouveau)
  const handleRecrypt = () => {
    setHasValidKey(false)
    setPrivateKeyInput("")
    setDecryptedMessages({})
    setShowDecryptInput(false)
    console.log("🔒 Messages rechiffrés - clé effacée")
  }

  const encryptMessage = async (message: string, publicKey: CryptoKey) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      data,
    )
    return arrayBufferToBase64(encrypted)
  }

  const decryptMessage = async (encryptedMessage: string, privateKey: CryptoKey) => {
    try {
      const encryptedData = base64ToArrayBuffer(encryptedMessage)
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: "RSA-OAEP",
        },
        privateKey,
        encryptedData,
      )
      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      console.error("Decryption error:", error)
      return "[Message non déchiffrable]"
    }
  }

  const decryptAllMessages = async () => {
    // Cette fonction n'est plus utilisée - les messages ne se déchiffrent qu'avec la clé saisie
    console.log("Les messages ne se déchiffrent qu'avec votre clé privée saisie")
  }

  // Déchiffrer tous les messages avec la clé privée fournie par l'utilisateur
  const decryptAllMessagesWithKey = async (privateKeyArray: number[]) => {
    try {
      console.log(`🔐 Déchiffrement des messages avec votre clé privée`)
      const privateKey = await importPrivateKey(privateKeyArray)
      const newDecryptedMessages: { [key: string]: string } = {}

      for (const message of messages) {
        const isOwn = message.senderId === currentUser?._id
        
        // Choisir le bon chiffrement selon le format et l'expéditeur
        let encryptedContent: string | undefined
        let messageFormat = "inconnu"
        
        if (message.encryptedForSender && message.encryptedForReceiver) {
          // Nouveau format avec double chiffrement
          encryptedContent = isOwn ? message.encryptedForSender : message.encryptedForReceiver
          messageFormat = "nouveau (double)"
        } else if (message.encryptedContent) {
          // Ancien format avec chiffrement simple
          encryptedContent = message.encryptedContent
          messageFormat = "ancien (simple)"
        }
        
        console.log(`🔑 Déchiffrement du message ${isOwn ? '(envoyé)' : '(reçu)'} [${messageFormat}] (ID: ${message._id.substring(0, 8)}...)`)
        
        if (encryptedContent) {
          const decrypted = await decryptMessage(encryptedContent, privateKey)
          
          if (decrypted !== "[Message non déchiffrable]") {
            console.log(`✅ Message déchiffré avec succès`)
            newDecryptedMessages[message._id] = decrypted
          } else {
            console.warn(`⚠️ Ce message n'était pas chiffré pour votre clé`)
            newDecryptedMessages[message._id] = `🔒 [Message chiffré - clé incorrecte]`
          }
        } else {
          console.error(`❌ Message mal formaté - pas de contenu chiffré`)
          newDecryptedMessages[message._id] = `❌ [Message corrompu]`
        }
      }

      setDecryptedMessages(newDecryptedMessages)
      console.log(`🔐 ${Object.keys(newDecryptedMessages).length} messages traités`)
      
    } catch (error) {
      console.error("❌ Erreur lors du déchiffrement:", error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !otherUser || !currentUser) return
    
    // Vérifier qu'une clé valide est disponible
    if (!hasValidKey) {
      alert("❌ Impossible d'envoyer le message : veuillez d'abord entrer votre clé personnelle")
      return
    }

    try {
      // 🔐 SYSTÈME DOUBLE CHIFFREMENT: Chiffrer pour l'expéditeur ET le destinataire
      console.log(`🔐 Double chiffrement du message`)
      
      // Chiffrer avec la clé publique du destinataire
      const recipientPublicKey = await importPublicKey(otherUser.publicKey)
      const encryptedForReceiver = await encryptMessage(newMessage, recipientPublicKey)
      
      // Chiffrer avec la clé publique de l'expéditeur (vous)
      const senderPublicKey = await importPublicKey(currentUser.publicKey)
      const encryptedForSender = await encryptMessage(newMessage, senderPublicKey)

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: currentUser._id,
          receiverId: userId,
          encryptedForSender,
          encryptedForReceiver,
        }),
      })

      if (response.ok) {
        setNewMessage("")
        fetchMessages() // Refresh messages
        
        // Notification de succès
        console.log("✅ Message doublement chiffré et envoyé avec succès")
        console.log(`🔐 Version pour ${otherUser.username}: chiffrée avec sa clé publique`)
        console.log(`🔐 Version pour vous: chiffrée avec votre clé publique`)
        console.log(`🔑 Chacun peut déchiffrer sa version avec sa clé privée`)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      alert("Erreur lors de l'envoi du message")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement de la conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/dashboard")} className="p-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {otherUser?.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="font-semibold text-gray-900">{otherUser?.username}</h1>
                  <div className="flex items-center space-x-1 text-sm text-green-600">
                    <Shield className="h-3 w-3" />
                    <span>Chiffrement personnel</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Key className="h-2 w-2" />
                    <span>Clé personnelle requise pour lire les messages</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Indicateur de statut de déchiffrement */}
            <div className="flex items-center space-x-2">
              {hasValidKey ? (
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">Messages déchiffrés</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1 rounded-full">
                  <Key className="h-4 w-4 text-gray-600" />
                  <span className="text-xs text-gray-700 font-medium">Messages chiffrés</span>
                </div>
              )}
              <Button 
                onClick={hasValidKey ? handleRecrypt : () => setShowDecryptInput(!showDecryptInput)}
                size="sm"
                variant="outline"
              >
                {hasValidKey ? "🔒 Rechiffrer" : "🔑 Déchiffrer"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Zone de déchiffrement */}
        {showDecryptInput && !hasValidKey && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-medium text-blue-800">Entrez votre clé personnelle</h3>
              </div>
              <p className="text-sm text-blue-700">
                Saisissez votre clé personnelle (16 caractères) pour déchiffrer et lire vos messages.
              </p>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={privateKeyInput}
                  onChange={(e) => setPrivateKeyInput(e.target.value)}
                  className="flex-1"
                  maxLength={19} // 16 caractères + 3 tirets
                />
                <Button onClick={handlePrivateKeySubmit}>
                  🔓 Déchiffrer
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <Card className="h-full flex flex-col">
          <CardContent className="flex-1 p-0">
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun message pour le moment</p>
                  <p className="text-sm">Envoyez le premier message chiffré !</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.senderId === currentUser?._id
                  
                  // Afficher le contenu selon l'état de déchiffrement
                  let displayContent: string
                  let isDecrypted = false
                  
                  if (hasValidKey && decryptedMessages[message._id]) {
                    displayContent = decryptedMessages[message._id]
                    isDecrypted = !displayContent.includes("[Message chiffré")
                  } else {
                    // Afficher le contenu chiffré brut (tronqué pour la lisibilité)
                    let encryptedToShow: string
                    
                    if (message.encryptedForSender && message.encryptedForReceiver) {
                      // Nouveau format avec double chiffrement
                      encryptedToShow = isOwn ? message.encryptedForSender : message.encryptedForReceiver
                    } else if (message.encryptedContent) {
                      // Ancien format avec chiffrement simple
                      encryptedToShow = message.encryptedContent
                    } else {
                      encryptedToShow = "DONNÉES_CORROMPUES"
                    }
                    
                    displayContent = `🔒 ${encryptedToShow.substring(0, 50)}...`
                  }

                  return (
                    <div key={message._id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwn ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        <p className="text-sm font-mono">{displayContent}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs ${isOwn ? "text-blue-100" : "text-gray-500"}`}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                          <div className="flex items-center space-x-1">
                            {isDecrypted ? (
                              <Check className={`h-3 w-3 ${isOwn ? "text-green-200" : "text-green-500"}`} />
                            ) : (
                              <Lock className={`h-3 w-3 ${isOwn ? "text-yellow-200" : "text-yellow-500"}`} />
                            )}
                          </div>
                        </div>
                        {/* Indicateur de statut */}
                        <div className={`text-xs mt-1 ${isOwn ? "text-blue-100" : "text-gray-400"}`}>
                          {isDecrypted ? (
                            <span className="flex items-center space-x-1">
                              <Key className="h-2 w-2" />
                              <span>Déchiffré avec votre clé</span>
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1">
                              <Lock className="h-2 w-2" />
                              <span>Chiffré - clé requise</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          <div className="border-t p-4">
            <form onSubmit={sendMessage} className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={hasValidKey ? "Tapez votre message..." : "Entrez votre clé personnelle pour envoyer des messages"}
                className="flex-1"
                disabled={!hasValidKey}
              />
              <Button 
                type="submit" 
                disabled={!newMessage.trim() || !hasValidKey}
                title={!hasValidKey ? "Entrez votre clé personnelle pour envoyer" : "Envoyer le message"}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            {hasValidKey && (
              <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1">
                <Key className="h-3 w-3" />
                <span>Messages chiffrés pour {otherUser?.username} - Seule sa clé personnelle peut les déchiffrer</span>
              </p>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
