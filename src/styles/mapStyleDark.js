export default [
    {
        featureType: "administrative",
        elementType: "labels.text.fill",
        stylers: [{ color: "#444444" }]
    },
    {
        featureType: "landscape",
        elementType: "all",
        stylers: [{ color: "#3c3c3c" }]
    },
    {
        featureType: "poi",
        elementType: "all",
        stylers: [{ visibility: "off" }]
    },
    {
        featureType: "road",
        elementType: "all",
        stylers: [
            { saturation: -100 },
            { lightness: -60 },
            { visibility: "simplified" }
        ]
    },
    {
        featureType: "road.highway",
        elementType: "all",
        stylers: [{ visibility: "simplified" }]
    },
    {
        featureType: "road.arterial",
        elementType: "labels.icon",
        stylers: [{ visibility: "off" }]
    },
    {
        featureType: "transit",
        elementType: "all",
        stylers: [{ visibility: "off" }]
    },
    {
        featureType: "water",
        elementType: "all",
        stylers: [
            { color: "#0084b9" },
            { visibility: "on" }
        ]
    }
];
