import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { View, ActivityIndicator } from 'react-native'

import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MapDrawerNavigator from './MapDrawerNavigator';
import StatisticsScreen from '../screens/StatisticsScreen';
import { API_BASE_URL } from '../config/api';

const Stack = createNativeStackNavigator();
const TOKEN_KEY = 'user_jwt_token'; // Mesma chave usada no LoginScreen

export default function AppNavigator() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState('cidadao');
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Estado para o loading inicial

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const token = await SecureStore.getItemAsync(TOKEN_KEY);
                if (token) {
                    const response = await fetch(`${API_BASE_URL}/api/auth/validate-token`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        // Se a resposta for OK, o token é válido.
                        const data = await response.json();
                        setIsLoggedIn(true);
                        setUserRole(data.user.cargo || 'cidadao');
                        setUserId(data.user.id);
                    } else {
                        // Se não, o token é inválido/expirado, removemos ele.
                        await SecureStore.deleteItemAsync(TOKEN_KEY);
                        setIsLoggedIn(false);
                    }
                }
            } catch (e) {
                console.error("Erro ao buscar token", e);
            } finally {
                setIsLoading(false);
            }
        };
        checkLoginStatus();
    }, []);

    if (isLoading) {
        // Pode mostrar um splash screen ou um loader
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {isLoggedIn ? (
                <Stack.Navigator screenOptions={{ headerShown: true }}>
                    <Stack.Screen name="Home">
                        {(props) => <HomeScreen {...props} userRole={userRole} setIsLoggedIn={setIsLoggedIn} />}
                    </Stack.Screen>
                    <Stack.Screen name="Map" options={{ headerShown: false }}>
                        {(props) => <MapDrawerNavigator {...props} userRole={userRole} userId={userId} />}
                    </Stack.Screen>
                    <Stack.Screen
                        name="Statistics"
                        component={StatisticsScreen}
                        options={{ title: 'Estatísticas' }}
                    />
                </Stack.Navigator>
            ) : (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Login">
                        {(props) => <LoginScreen
                            {...props}
                            setIsLoggedIn={setIsLoggedIn}
                            setUserRole={setUserRole}
                            setUserId={setUserId}
                        />}
                    </Stack.Screen>
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </Stack.Navigator>
            )}
        </NavigationContainer>
    );
}
