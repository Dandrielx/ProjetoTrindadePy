import 'dotenv/config'; // Importa para carregar as variáveis do arquivo .env

export default {
    expo: {
        name: "projeto_trindade_v1",
        slug: "projeto_trindade_v1",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        newArchEnabled: true, // Mantido do seu app.json original
        splash: {
            image: "./assets/splash-icon.png", // Mantido do seu app.json original
            resizeMode: "contain", // Mantido do seu app.json original
            backgroundColor: "#ffffff" // Mantido do seu app.json original
        },
        ios: {
            supportsTablet: true, // Mantido do seu app.json original

            infoPlist: {
                NSLocationWhenInUseUsageDescription: "Precisamos da sua localização para mostrar sua posição no mapa e permitir a marcação de pontos de poluição."
            }
            // Se você também usar Google Maps no iOS e precisar de uma chave de API:
            // config: {
            //   googleMapsApiKey: process.env.Maps_API_KEY_IOS || "SEU_PLACEHOLDER_IOS"
            // }
        },
        android: {
            // Se você tinha um "package" no seu app.json original, adicione-o aqui também.
            // Ex: package: "com.dandrielx.projetotrindade",
            package: "com.dionyseicholz.projeto_trindade_v1",
            permissions: [
                "android.permission.ACCESS_COARSE_LOCATION",
                "android.permission.ACCESS_FINE_LOCATION"
            ],
            config: {
                googleMaps: {
                    // A chave da API agora é lida da variável de ambiente
                    apiKey: process.env.Maps_API_KEY
                }
            },

            "usesCleartextTraffic": true,

            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png", // Mantido do seu app.json original
                backgroundColor: "#ffffff" // Mantido do seu app.json original
            }
        },
        extra: {
            eas: {
                projectId: "8a58a629-9474-4f6e-bff1-600dec46b7da"
            }
        },
        web: {
            favicon: "./assets/favicon.png" // Mantido do seu app.json original
        }
        // Adicione aqui quaisquer outras configurações de alto nível que existiam
        // no seu app.json original, como 'plugins', 'extra', etc.
        // Exemplo para 'extra.eas.projectId':
        // extra: {
        //   eas: {
        //     projectId: "SEU_PROJECT_ID_DO_EAS_AQUI" // Se for o caso
        //   }
        // }
    }
};