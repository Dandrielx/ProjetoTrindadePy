import React, { useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import MapScreen from '../screens/MapScreen';
import { DrawerContent } from './DrawerContent';

const Drawer = createDrawerNavigator();

export default function MapDrawerNavigator() {
    // Os estados que controlam o mapa agora vivem aqui, no navegador pai
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [showMarkers, setShowMarkers] = useState(false);
    const [mapTheme, setMapTheme] = useState('light');

    return (
        <Drawer.Navigator
            drawerContent={props =>
                <DrawerContent
                    {...props}
                    showHeatmap={showHeatmap}
                    setShowHeatmap={setShowHeatmap}
                    showMarkers={showMarkers}
                    setShowMarkers={setShowMarkers}
                    mapTheme={mapTheme}
                    setMapTheme={setMapTheme}
                />
            }
            screenOptions={{ headerShown: true }} // Mostra o botão do menu
        >
            <Drawer.Screen name="MapScreen">
                {props =>
                    <MapScreen
                        {...props}
                        showHeatmap={showHeatmap}
                        showMarkers={showMarkers}
                        mapTheme={mapTheme}
                    />
                }
            </Drawer.Screen>
        </Drawer.Navigator>
    );
}