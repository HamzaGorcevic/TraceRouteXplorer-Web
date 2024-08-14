import React, { useContext, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { RevolvingDot } from "react-loader-spinner";

import { fetchTracerouteData, fetchIpInfo, getRandomColor } from "./utils";
import "./mapComponent.css";
import Sidebar from "../sidebar/sidebar";
import { CoordsContext } from "../../contex";

const MapComponent = () => {
    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    const [map, setMap] = useState(null);
    const [loader, setLoader] = useState(false);
    const [hops, setHops] = useState([]);
    const [server, setServer] = useState(
        "https://traceroutexplorer-web-2.onrender.com"
    );
    const { coords, setCoords } = useContext(CoordsContext);
    const [markers, setMarkers] = useState([]);

    useEffect(() => {
        initializeMap();

        return () => {
            if (map) {
                map.remove();
            }
        };
    }, []);

    useEffect(() => {
        if (map) {
            map.flyTo({ zoom: 18, center: coords, speed: 3 });
        }
    }, [coords]);

    const initializeMap = () => {
        const initialCoordinates = [43.158157, 20.346822];
        const newMap = new mapboxgl.Map({
            container: "map",
            style: "mapbox://styles/mapbox/streets-v12",
            zoom: 2,
            center: initialCoordinates,
        });

        setMap(newMap);
    };

    const clearMap = () => {
        if (markers.length) {
            markers.forEach((marker) => marker.remove());
            setMarkers([]);
        }

        if (map) {
            let layers = map.getStyle().layers;
            layers.forEach((layer) => {
                if (layer.id.startsWith("custom-layer-")) {
                    map.removeLayer(layer.id);
                }
            });
        }
    };

    const handleMeasureLatencyClick = async (e) => {
        if (e.key === "Enter" || (e.type === "click" && !loader)) {
            setLoader(true);
            clearMap();
            try {
                const hostURL = document.querySelector(".usersHostValue").value;
                const result = await fetchTracerouteData(server, hostURL);
                setHops(result);
                showImageOfMap(result);
            } catch (error) {
                console.error(error);
                alert("Wrong IP address or domain name");
            } finally {
                setLoader(false);
            }
        }
    };

    const addMarker = (lng, lat, popup) => {
        const marker = new mapboxgl.Marker({ color: "blue", rotation: 45 })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map);

        setMarkers((prevMarkers) => [...prevMarkers, marker]);
    };

    const showImageOfMap = (result) => {
        setLoader(false);
        let coordinates = [];
        result.forEach((hop, i) => {
            if (hop !== "1" && !hop.bogon && hop.ip) {
                const [lat, lon] = hop.loc.split(",");
                const temp = [
                    parseFloat(lon) + i / 1000,
                    parseFloat(lat) + i / 1000,
                ];
                if (i == 0) {
                    setCoords(temp);
                }
                coordinates.push(temp);
                hop.longitude = temp[0];
                hop.latitude = temp[1];

                const popup = new mapboxgl.Popup({ className: "custom-popup" })
                    .setHTML(`
                        <p>Country: ${hop.country}</p>
                        <p>Hop: ${i}</p>
                        <p>IP Address: ${hop.ip}</p>
                        <p>Latitude: ${hop.latitude} Longitude: ${hop.longitude}</p>
                        <p>Hostname: ${hop.hostname}</p>
                        <p>Region: ${hop.region}</p>
                        <p>Organization: ${hop.org}</p>
                        <p>ASN: ${hop.asn}</p>
                        <p>Timezone: ${hop.timezone}</p>
                        <p>Company Name: ${hop.company?.name}</p>
                        <p>Company Domain: ${hop.company?.domain}</p>
                    `);

                if (!isNaN(temp[0])) {
                    addMarker(temp[0], temp[1], popup);
                }
            }
        });

        if (coordinates.length >= 2) {
            const segmentColors = Array.from(
                { length: coordinates.length - 1 },
                getRandomColor
            );

            coordinates.forEach((coord, i) => {
                if (i < coordinates.length - 1) {
                    const startCoord = coordinates[i];
                    const endCoord = coordinates[i + 1];
                    const segmentGeojson = {
                        type: "Feature",
                        properties: {},
                        geometry: {
                            type: "LineString",
                            coordinates: [startCoord, endCoord],
                        },
                    };

                    map.addLayer({
                        id: `custom-layer-${Math.random()}`,
                        type: "line",
                        source: { type: "geojson", data: segmentGeojson },
                        paint: {
                            "line-color": segmentColors[i],
                            "line-width": 10,
                            "line-offset": 5,
                        },
                    });
                }
            });
        }
    };

    return (
        <div className="container">
            <div className="infoContainer">
                <h2>Traceroute Online - Trace and Map the Packets Path</h2>
                <p>
                    Utilize traceroute online to perform an advanced visual
                    traceroute that maps and enriches output from mtr. With ASN
                    and Geolocation data to better understand the network path.
                </p>
            </div>

            <div className="searchContainer">
                <input
                    type="text"
                    className="usersHostValue"
                    placeholder="Enter host URL"
                    onKeyDown={handleMeasureLatencyClick}
                />
                <div className="actions">
                    <button
                        disabled={loader}
                        onClick={handleMeasureLatencyClick}
                    >
                        Trace
                    </button>
                    <select
                        disabled={loader}
                        onChange={(el) => setServer(el.target.value)}
                    >
                        <option value="https://traceroutexplorer-web-2.onrender.com">
                            Europe
                        </option>
                        <option value="https://traceroutexplorer-web-southeastasia.onrender.com">
                            South East Asia
                        </option>
                    </select>
                </div>
            </div>
            <div className="containerMapSidebar">
                <div className="mapContainer">
                    <button className="clearMap" onClick={clearMap}>
                        Clear map
                    </button>
                    <div className={`loader ${!loader ? "hidden" : ""}`}>
                        <RevolvingDot
                            visible={true}
                            height="80"
                            width="80"
                            color="#4fa94d"
                            ariaLabel="revolving-dot-loading"
                        />
                    </div>
                    <div
                        id="map"
                        style={{ height: "100%", width: "100%" }}
                    ></div>
                </div>
                <Sidebar hops={hops} />
            </div>
        </div>
    );
};

export default MapComponent;
