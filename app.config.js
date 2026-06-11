export default {
  expo: {
    name: "Movidia",
    slug: "Movidia",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#7DDDD8"
      },
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: "pan",
      permissions: ["ACTIVITY_RECOGNITION"],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      },
      package: "com.kaceme.Movidia"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/splash-kroki.png",
          imageWidth: 350,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "8a75ddf0-715f-4f21-b71b-c6d6d480cf02"
      }
    }
  }
};