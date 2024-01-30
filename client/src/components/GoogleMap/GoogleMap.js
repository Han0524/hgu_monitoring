// GoogleMap.js

import React, { useState, useEffect, useRef } from "react";
import nodeConfig from "./nodeConfig";

const GoogleMap = ({ option }) => {
  const [map, setMap] = useState(null);
  const ref = useRef();
  const markerRefs = useRef([]);

  useEffect(() => {
    const newMap = new window.google.maps.Map(ref.current, {
      center: { lat: 36.1032734, lng: 129.3893488 },
      zoom: 16.3,
      styles:
        // 기호에 맞게 스타일 변경할 것!!! (상의)
        // [
        //   {
        //     "elementType": "labels",
        //     "stylers": [
        //       {
        //         "visibility": "off"
        //       }
        //     ]
        //   },
        //   {
        //     "featureType": "administrative.land_parcel",
        //     "stylers": [
        //       {
        //         "visibility": "off"
        //       }
        //     ]
        //   },
        //   {
        //     "featureType": "administrative.neighborhood",
        //     "stylers": [
        //       {
        //         "visibility": "off"
        //       }
        //     ]
        //   },
        //   {
        //     "featureType": "road.arterial",
        //     "elementType": "labels",
        //     "stylers": [
        //       {
        //         "visibility": "off"
        //       }
        //     ]
        //   },
        //   {
        //     "featureType": "road.highway",
        //     "elementType": "labels",
        //     "stylers": [
        //       {
        //         "visibility": "off"
        //       }
        //     ]
        //   },
        //   {
        //     "featureType": "road.local",
        //     "stylers": [
        //       {
        //         "visibility": "off"
        //       }
        //     ]
        //   }
        // ]
        [
          {
            featureType: "administrative.land_parcel",
            elementType: "labels",
            stylers: [
              {
                visibility: "off",
              },
            ],
          },
          {
            featureType: "poi",
            elementType: "labels.text",
            stylers: [
              {
                visibility: "off",
              },
            ],
          },
          {
            featureType: "road.local",
            elementType: "labels",
            stylers: [
              {
                visibility: "off",
              },
            ],
          },
        ],
    });

    const markerColors = {
      good: "#7D9DDB",
      normal: "#6EB057",
      bad: "#D7E067",
      worst: "#BB7373",
      undefined: "black",
    };

    // 노드 정보 가져오기
    const markers = nodeConfig.map((node) => {
      let value;
      let sub_level = "";

      switch (option) {
        case "pm25":
          value = node.pm25;
          if (value >= 76) sub_level = "worst";
          else if (value >= 36) sub_level = "bad";
          else if (value >= 16) sub_level = "normal";
          else if (value >= 0) sub_level = "good";
          else sub_level = "undefined";
          break;
        case "pm10":
          value = node.pm10;
          if (value >= 151) sub_level = "worst";
          else if (value >= 81) sub_level = "bad";
          else if (value > 31) sub_level = "normal";
          else if (value >= 0) sub_level = "good";
          else sub_level = "undefined";
          break;
        case "HCHO":
          value = node.HCHO;
          break;
        default:
          value = undefined;
      }

      const markerColor = markerColors[sub_level];

      const customMarkerIcon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: markerColor,
        fillOpacity: 0.7,
        scale: 20,
        strokeColor: markerColor,
        strokeWeight: 3,
      };

      return new window.google.maps.Marker({
        position: node.position,
        map: newMap,
        icon: customMarkerIcon,
        label: {
          text: node.label,
          color: "white",
          fontSize: "1.1em",
          fontWeight: "500",
        },
        optimized: false,
      });
    });

    // markers를 markerRefs.current에 저장
    markerRefs.current = markers;

    setMap(newMap);

    const zoomChangedListener = newMap.addListener("zoom_changed", () => {
      const currentZoom = newMap.getZoom();
      const minZoomToShowMarker = 14;

      markerRefs.current.forEach((marker) => {
        if (currentZoom <= minZoomToShowMarker) {
          marker.setVisible(false);
        } else {
          marker.setVisible(true);
        }
      });
    });

    return () => {
      window.google.maps.event.removeListener(zoomChangedListener);
    };
  }, [option]);

  return (
    <div ref={ref} id="map" style={{ width: "100%", height: "100%" }}></div>
  );
};

export default GoogleMap;
