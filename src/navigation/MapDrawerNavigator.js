// src/navigation/MapDrawerNavigator.js
import React, { useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MapScreen from '../screens/MapScreen';
import { DrawerContent } from './DrawerContent';

const Drawer = createDrawerNavigator();

export default function MapDrawerNavigator({ userRole, userId }) {
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [showMarkers, setShowMarkers] = useState(true);
    const [mapTheme, setMapTheme] = useState('light');

    // O estado principal dos filtros vive aqui
    const [filters, setFilters] = useState({
        startDate: null,
        endDate: null,
        types: []
    });

    return (
        <Drawer.Navigator
            drawerContent={props =>
                // Passa os estados e as funções para o menu lateral
                <DrawerContent
                    {...props}
                    showHeatmap={showHeatmap}
                    setShowHeatmap={setShowHeatmap}
                    showMarkers={showMarkers}
                    setShowMarkers={setShowMarkers}
                    mapTheme={mapTheme}
                    setMapTheme={setMapTheme}
                    filters={filters}
                    setFilters={setFilters} // Passa a função para o Drawer poder atualizar o estado
                />
            }
            screenOptions={{
                headerShown: true,
                headerTitle: "Mapa de Poluição"
            }}
        >
            <Drawer.Screen name="MapScreenComponent">
                {props =>
                    // Passa os valores de estado como props para o ecrã do mapa
                    <MapScreen
                        {...props}
                        showHeatmap={showHeatmap}
                        showMarkers={showMarkers}
                        mapTheme={mapTheme}
                        filters={filters} // Passa o estado atual dos filtros
                        userRole={userRole}
                        userId={userId}
                    />
                }

            </Drawer.Screen>
        </Drawer.Navigator>
    );
}