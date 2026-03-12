import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: "AIzaSyAni6H26MgOy8AqhToi0UnPd3CqzVjYxjU",
    authDomain: "balance-sheet-b1db5.firebaseapp.com",
    projectId: "balance-sheet-b1db5",
    storageBucket: "balance-sheet-b1db5.firebasestorage.app",
    messagingSenderId: "841684696266",
    appId: "1:841684696266:web:3c53378d9aa8f35f748833",
    measurementId: "G-QBPK0LM7SE"
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const secondaryApp = getApps().find(a => a.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary')
const auth = getAuth(app)
const secondaryAuth = getAuth(secondaryApp)
const db = getFirestore(app)

export { app, auth, secondaryAuth, db }
