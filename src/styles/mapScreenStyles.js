import { StyleSheet } from 'react-native';

export default StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        backgroundColor: '#007AFF',
        borderRadius: 30,
        padding: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
});
