"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [loginData, setLoginData] = useState({ username: "", password: "" })
  const [registerData, setRegisterData] = useState({ username: "", password: "", confirmPassword: "" })
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [generatedKeys, setGeneratedKeys] = useState<any>(null)
  const [showKey, setShowKey] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem("currentUser")
    if (user) {
      router.push("/dashboard")
    }
  }, [router])

  const generateKeyPair = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    )

    const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey)
    const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey)

    return {
      publicKey: Array.from(new Uint8Array(publicKey)),
      privateKey: Array.from(new Uint8Array(privateKey)),
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      })

      if (response.ok) {
        const user = await response.json()
        localStorage.setItem("currentUser", JSON.stringify(user))
        router.push("/dashboard")
      } else {
        alert("Identifiants incorrects")
      }
    } catch (error) {
      alert("Erreur de connexion")
    } finally {
      setIsLoading(false)
    }
  }

  // Générer une clé courte et lisible (16 caractères)
  const generateShortKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    // Ajouter des tirets pour la lisibilité : XXXX-XXXX-XXXX-XXXX
    return result.match(/.{4}/g)?.join('-') || result
  }

  const handleGenerateKey = async () => {
    try {
      setIsLoading(true)
      
      // Générer une clé courte pour l'utilisateur (16 caractères)
      const shortKey = generateShortKey()
      setGeneratedKey(shortKey)
      
      // Générer quand même les clés RSA pour le chiffrement en arrière-plan
      const keys = await generateKeyPair()
      setGeneratedKeys({
        ...keys,
        userKey: shortKey // Associer la clé courte aux clés RSA
      })
      
      setShowKey(true)
    } catch (error) {
      alert("Erreur lors de la génération de la clé")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (registerData.password !== registerData.confirmPassword) {
      alert("Les mots de passe ne correspondent pas")
      return
    }

    if (!generatedKey) {
      alert("Veuillez d'abord générer votre clé de chiffrement")
      return
    }

    setIsLoading(true)

    try {
      // Utiliser les clés déjà générées
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerData.username,
          password: registerData.password,
          publicKey: generatedKeys.publicKey,
          privateKey: generatedKeys.privateKey,
          userKey: generatedKeys.userKey, // Clé courte pour l'utilisateur
        }),
      })

      if (response.ok) {
        const user = await response.json()
        // Stocker l'utilisateur avec toutes ses clés pour permettre le déchiffrement
        localStorage.setItem("currentUser", JSON.stringify(user))
        router.push("/dashboard")
      } else {
        const error = await response.json()
        alert(error.message || "Erreur lors de l'inscription")
      }
    } catch (error) {
      alert("Erreur lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  const copyKeyToClipboard = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey)
      alert("Clé copiée dans le presse-papiers !")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Messagerie Chiffrée</CardTitle>
          <CardDescription>Connexion sécurisée avec chiffrement RSA</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Nom d'utilisateur</Label>
                  <Input
                    id="login-username"
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">Nom d'utilisateur</Label>
                  <Input
                    id="register-username"
                    type="text"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Mot de passe</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                
                {/* Section génération de clé */}
                <div className="space-y-3 border-t pt-4">
                  <div className="text-center">
                    <Label className="text-sm font-medium">Clé personnelle (16 caractères)</Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Cette clé courte vous permettra d'accéder à vos messages
                    </p>
                  </div>
                  
                  {!showKey ? (
                    <Button 
                      type="button" 
                      onClick={handleGenerateKey} 
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Génération..." : "🔐 Générer ma clé personnelle"}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-yellow-600 font-medium">⚠️ Important !</span>
                        </div>
                        <p className="text-sm text-yellow-700 mb-3">
                          Notez cette clé ! Vous en aurez besoin pour accéder à vos messages.
                        </p>
                        <div className="bg-white border rounded p-3 mb-3 text-center">
                          <code className="text-lg font-mono font-bold tracking-wider">{generatedKey}</code>
                        </div>
                        <Button 
                          type="button" 
                          onClick={copyKeyToClipboard}
                          className="w-full"
                          size="sm"
                        >
                          📋 Copier la clé
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !generatedKey}
                >
                  {isLoading ? "Inscription..." : "S'inscrire"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
