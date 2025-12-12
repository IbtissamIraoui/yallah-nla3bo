import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_IP } from '../config';

console.log("📡 ADRESSE DU SERVEUR CONFIGURÉE :", SERVER_IP);

const client = axios.create({
  baseURL: SERVER_IP,
  timeout: 10000,
});

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  
  // LE MOUCHARD : Affiche l'URL complète dans le terminal
  const fullUrl = `${config.baseURL}${config.url}`;
  console.log(`🚀 TENTATIVE D'APPEL : ${config.method.toUpperCase()} ${fullUrl}`);
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("🔑 Token ajouté !");
  } else {
    console.log("⚠️ Pas de token trouvé (Est-ce que tu es connecté ?)");
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default client;