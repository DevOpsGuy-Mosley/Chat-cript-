export class CryptoUtils {
  static async generateKeyPair() {
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

  static async importPublicKey(keyData: number[]) {
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

  static async importPrivateKey(keyData: number[]) {
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

  static arrayBufferToBase64(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ""
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  static base64ToArrayBuffer(base64: string) {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  static async encryptMessage(message: string, publicKey: CryptoKey) {
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      data,
    )
    return this.arrayBufferToBase64(encrypted)
  }

  static async decryptMessage(encryptedMessage: string, privateKey: CryptoKey) {
    try {
      const encryptedData = this.base64ToArrayBuffer(encryptedMessage)
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
}
