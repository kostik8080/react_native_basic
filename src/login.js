import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);

    // При запуске проверяем сохраненные данные
    useEffect(() => {
        const loadSaveData = async () => {
            try {
                const savedUsername = await AsyncStorage.getItem('username');
                const savedPassword = await AsyncStorage.getItem('password');
                if (savedUsername && savedPassword) {
                    setUsername(savedUsername);
                    setPassword(savedPassword);
                    setRemember(true);
                }
            } catch (error) {
                console.error('Ошибка загрузки данных', error);
            }
        };
        loadSaveData();
    }, []);
    const handleLogin = async () => {
        if (username === 'user1' && password === 'password1') {
            // Если выбрана галочка - сохраняем данные
            if (remember) {
                await AsyncStorage.setItem('username', username);
                await AsyncStorage.setItem('password', password);
            } else {
                await AsyncStorage.removeItem('username');
                await AsyncStorage.removeItem('password');
            }
            navigation.navigate('Menu');
        } else {
            Alert.alert('Ошибка', 'Неверное имя пользователя или пароль');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Вход в систему</Text>

            <TextInput 
                style={styles.input}
                placeholder="Логин"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Пароль"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRemember(!remember)}
            >
                <View style={[styles.checkbox, remember && styles.checkboxChecked]} />
                <Text style={styles.checkboxLabel}>Запомнить меня</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Войти</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF69B4',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#555',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#FF69B4',
  },
  checkboxLabel: {
    fontSize: 16,
  },
});
