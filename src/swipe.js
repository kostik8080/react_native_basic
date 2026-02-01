// Импортируем нужные хуки и компоненты из React и React Native
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
} from "react-native";

// Получаем ширину и высоту экрана устройства
const { width, height } = Dimensions.get("window");

// Массив карточек (для примера используем одинаковые изображения)
const cards = [
  { id: "01", image: require("../assets/robot_01.jpg") },
  { id: "02", image: require("../assets/robot_02.jpg") },
  { id: "03", image: require("../assets/robot_03.jpg") },
  { id: "04", image: require("../assets/robot_04.jpg") },
  { id: "05", image: require("../assets/robot_05.jpg") },
];

// Карта переходов при свайпе: для каждой карточки указано, куда перейти при свайпе влево/вправо
const swipeMap = {
  "01": { left: "03", right: "02" },
  "02": { left: "04", right: "05" },
  "03": { left: "04", right: "05" },
  "04": { left: "01", right: "02" },
  "05": { left: "02", right: "01" },
};

// Основной компонент экрана свайпа
export default function SwipeScreen() {

  // Состояние — индекс текущей отображаемой карточки
  const [currentIndex, setCurrentIndex] = useState(0);

  // Animated.ValueXY — хранит координаты анимации по X и Y
  const position = useRef(new Animated.ValueXY()).current;

  // Создаем обработчик жестов PanResponder
  const panResponder = useRef(
    PanResponder.create({
      // Разрешаем реагировать на касания
      onStartShouldSetPanResponder: () => true,

      // Обновляем позицию карточки при движении пальца
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy }); // dx — смещение по X, dy — по Y
      },

      // Когда пользователь отпускает палец
      onPanResponderRelease: (_, gesture) => {
        // Если свайп вправо (dx > 100) — листаем вправо
        if (gesture.dx > 100) {
          swipe("right");
        }
        // Если свайп влево (dx < -100) — листаем влево
        else if (gesture.dx < -100) {
          swipe("left");
        }
        // Если свайп короткий — возвращаем карточку обратно в центр
        else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Функция для обработки свайпа
  const swipe = (direction) => {
    // Получаем id текущей карточки
    const cardId = cards[currentIndex].id;

    // Определяем id следующей карточки в зависимости от направления
    const nextId = direction === "left" ? swipeMap[cardId].left : swipeMap[cardId].right;

    // Находим индекс карточки с нужным id
    const nextIndex = cards.findIndex((c) => c.id === nextId);

    // Анимируем уход текущей карточки за экран
    Animated.timing(position, {
      toValue: { x: direction === "left" ? -width : width, y: 0 }, // направление ухода
      duration: 200, // скорость анимации
      useNativeDriver: false,
    }).start(() => {
      // После завершения анимации сбрасываем позицию обратно в центр
      position.setValue({ x: 0, y: 0 });
      // Устанавливаем новую активную карточку
      setCurrentIndex(nextIndex >= 0 ? nextIndex : 0);
    });
  };

  // Рендеринг отдельной карточки
  const renderCard = (card, index) => {
    // Отображаем только текущую карточку
    if (index !== currentIndex) return null;

    // Интерполяция значения X в угол поворота (для эффекта наклона при свайпе)
    const rotate = position.x.interpolate({
      inputRange: [-width, 0, width], // диапазон смещения
      outputRange: ["-15deg", "0deg", "15deg"], // диапазон поворота
    });

    // Возвращаем Animated.View, чтобы анимации могли работать
    return (
      <Animated.View
        {...panResponder.panHandlers} // подключаем обработчик свайпа
        style={[
          styles.card, // базовый стиль
          { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] }, // применяем анимацию перемещения и поворота
        ]}
        key={card.id} // уникальный ключ
      >
        {/* Изображение карточки */}
        <Image source={card.image} style={styles.image} resizeMode="contain" />
        {/* Текст карточки (id) */}
        <Text style={styles.cardText}>{card.id}</Text>
      </Animated.View>
    );
  };

  // Основной рендер компонента
  return (
    <View style={styles.container}>
      {/* Рендерим текущую карточку */}
      {cards.map((card, index) => renderCard(card, index))}

      {/* Нижняя панель с индикаторами карточек */}
      <View style={styles.bottomBar}>
        {cards.map((c, idx) => (
          <Text
            key={c.id}
            // Подсвечиваем активную карточку
            style={[styles.bottomText, idx === currentIndex ? styles.activeText : null]}
          >
            {c.id}
          </Text>
        ))}
      </View>
    </View>
  );
}

// Стили для компонентов
const styles = StyleSheet.create({
  // Основной контейнер экрана
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5", // светлый фон
    justifyContent: "center",
    alignItems: "center",
  },

  // Стиль карточки
  card: {
    position: "absolute", // чтобы карточки накладывались друг на друга
    width: width * 0.8, // 80% ширины экрана
    height: height * 0.6, // 60% высоты экрана
    borderRadius: 10, // скругленные углы
    backgroundColor: "#fff", // белый фон карточки
    justifyContent: "center",
    alignItems: "center",
    // Тень для iOS
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 5,
    // Тень для Android
    elevation: 5,
  },

  // Изображение на карточке
  image: {
    width: "70%", // 70% ширины карточки
    height: "70%", // 70% высоты карточки
  },

  // Текст (id карточки)
  cardText: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: "bold",
  },

  // Нижняя панель с индикаторами
  bottomBar: {
    position: "absolute",
    bottom: 40, // отступ от низа экрана
    flexDirection: "row", // расположение элементов по горизонтали
    justifyContent: "space-around", // равномерно распределяем
    width: "80%", // ширина панели
  },

  // Стиль текста карточки в нижней панели
  bottomText: {
    fontSize: 18,
    color: "#999", // серый цвет
  },

  // Стиль активной карточки в панели
  activeText: {
    color: "#007AFF", // синий цвет
    fontWeight: "bold",
    fontSize: 20,
  },
});