import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_IP } from '../config';

console.log("📡 ADRESSE DU SERVEUR CONFIGURÉE :", SERVER_IP);

const client = axios.create({
  baseURL: SERVER_IP,
  timeout: 10000,
});

// Intercepteur requête : ajouter le token JWT
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Intercepteur réponse : sur 401/403, déconnecter l'utilisateur
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Supprimer token et mode, le composant App détectera le changement
      await AsyncStorage.multiRemove(['token', 'userMode']);
      // Émettre un événement global pour forcer le retour au login
      if (client._onAuthError) {
        client._onAuthError();
      }
    }
    return Promise.reject(error);
  }
);

export default client;