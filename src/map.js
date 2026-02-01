import React, { useState, useEffect, useRef } from "react";
import { Platform, View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function UniversalMapScreen() {
  const [mapReady, setMapReady] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [MapComponent, setMapComponent] = useState(null);
  const mapRef = useRef(null);

  // Динамическая загрузка компонентов карты
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Для web используем Leaflet
      initWebMap();
      setMapComponent('web');
      setMapReady(true);
    } else {
      // Для мобильных платформ динамически импортируем react-native-maps
      loadNativeMaps();
    }
  }, []);

  const loadNativeMaps = async () => {
    try {
      // Динамический импорт чтобы избежать ошибок на web
      const ReactNativeMaps = await import('react-native-maps');
      
      // Создаем компонент карты для нативных платформ
      const NativeMap = ({ region, onMapReady, children }) => (
        <ReactNativeMaps.default
          ref={mapRef}
          style={styles.nativeMap}
          region={region}
          onMapReady={onMapReady}
          showsUserLocation={true}
        >
          {children}
        </ReactNativeMaps.default>
      );

      setMapComponent({
        Map: NativeMap,
        Marker: ReactNativeMaps.Marker
      });
      setMapReady(true);
    } catch (error) {
      console.log('react-native-maps not available:', error);
      setError('Карта недоступна на этом устройстве');
    }
  };

  // Web карта с Leaflet
  const initWebMap = () => {
    if (window.L && document.getElementById('map-container')) {
      createWebMap();
      return;
    }
    loadLeaflet();
  };

  const loadLeaflet = () => {
    if (window.L) {
      createWebMap();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      setTimeout(createWebMap, 100);
    };
    script.onerror = () => setError('Не удалось загрузить карту');
    document.head.appendChild(script);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  };

  const createWebMap = () => {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer || !window.L) {
      setTimeout(createWebMap, 100);
      return;
    }

    try {
      if (window.leafletMap) window.leafletMap.remove();

      const map = window.L.map('map-container').setView([53.1959, 45.0183], 13);
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      window.leafletMap = map;
      mapRef.current = map;
      setMapReady(true);
      setError(null);
    } catch (err) {
      console.error('Leaflet init error:', err);
      setError('Ошибка инициализации карты');
    }
  };

  const handleFindMe = async () => {
    if (Platform.OS === "web") {
      findWebLocation();
    } else {
      await findMobileLocation();
    }
  };

  const findWebLocation = () => {
    if (!navigator.geolocation) {
      alert("Геолокация не поддерживается браузером");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        centerWebMap(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Не удалось получить местоположение');
      }
    );
  };

  const centerWebMap = (lat, lng) => {
    if (!window.leafletMap) return;

    window.leafletMap.setView([lat, lng], 15);
    
    if (window.currentMarker) {
      window.leafletMap.removeLayer(window.currentMarker);
    }
    
    window.currentMarker = window.L.marker([lat, lng])
      .addTo(window.leafletMap)
      .bindPopup(`
        <div style="text-align: center;">
          <strong>Вы здесь!</strong><br>
          Широта: ${lat.toFixed(6)}<br>
          Долгота: ${lng.toFixed(6)}
        </div>
      `)
      .openPopup();
  };

  const findMobileLocation = async () => {
    try {
      const { requestForegroundPermissionsAsync, getCurrentPositionAsync } = await import('expo-location');
      
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Разрешение на доступ к геолокации отклонено");
        return;
      }

      const loc = await getCurrentPositionAsync({});
      const newLocation = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setLocation(newLocation);
      setError(null);

      // Центрируем нативную карту
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...newLocation,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 1000);
      }
    } catch (err) {
      console.error("Location error:", err);
      setError('Ошибка получения местоположения');
    }
  };

  // Рендер нативной карты
  const renderNativeMap = () => {
    if (!MapComponent || !MapComponent.Map) return null;

    const region = location
      ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
      : {
          latitude: 53.1959,
          longitude: 45.0183,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };

    return (
      <MapComponent.Map 
        region={region}
        onMapReady={() => setMapReady(true)}
      >
        {location && MapComponent.Marker && (
          <MapComponent.Marker 
            coordinate={location} 
            title="Вы здесь 📍"
          />
        )}
      </MapComponent.Map>
    );
  };

  // Рендер web карты
  const renderWebMap = () => (
    <View style={styles.mapContainer}>
      <div 
        id="map-container" 
        style={styles.webMap}
      />
      
      {!mapReady && !error && (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Загрузка карты...</Text>
        </View>
      )}


    </View>
  );

  return (
    <View style={styles.container}>
      {/* Рендер карты в зависимости от платформы */}
      {Platform.OS === 'web' ? renderWebMap() : renderNativeMap()}

      {/* Кнопка "Найти меня" */}
      <TouchableOpacity 
        style={[
          styles.button, 
          !mapReady && styles.buttonDisabled
        ]} 
        onPress={handleFindMe}
        disabled={!mapReady}
      >
        <Text style={styles.buttonText}>Найти меня</Text>
      </TouchableOpacity>

      {/* Отображение ошибок */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          {Platform.OS === 'web' && (
            <TouchableOpacity 
              style={[styles.button, styles.retryButton]} 
              onPress={initWebMap}
            >
              <Text style={styles.buttonText}>Повторить</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Загрузка для нативных платформ */}
      {!mapReady && Platform.OS !== 'web' && !error && (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Загрузка карты...</Text>
        </View>
      )}
    </View>
  );
}

// Стили
const styles = StyleSheet.create({
  container: { 
    flex: 1,
    position: 'relative',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webMap: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#f0f0f0'
  },
  nativeMap: { 
    flex: 1 
  },
  center: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 1000
  },
  button: {
    position: "absolute",
    bottom: 40,
    right: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 25,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }
    })
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: 16
  },
  mapControls: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 1000
  },
  controlInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  controlText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center'
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center'
  },
  errorContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF3B30',
    zIndex: 1000,
    alignItems: 'center'
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: "#FF3B30",
  }
});