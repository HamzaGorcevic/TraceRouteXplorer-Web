import React, { useContext, useEffect, useMemo, useState } from "react";
import mapboxgl from "mapbox-gl";
import { RevolvingDot } from "react-loader-spinner";
import Sidebar from "../sidebar/sidebar";
import "./landing.css";
import { CoordsContext } from "../../contex";

const MapComponent = () => {
    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

    const germanyUrl = "https://traceroutexplorer-web-2.onrender.com";
    const southEastAsiaUrl =
        "https://traceroutexplorer-web-southeastasia.onrender.com";

    const [map, setMap] = useState(null);
    const [loader, setLoader] = useState(false);
    const [toggler, setToggler] = useState(false);
    const [value, setValue] = useState("");
    const [icon, setIcon] = useState("");
    const [hops, setHops] = useState([]);
    const [server, setServer] = useState(
        "https://traceroutexplorer-web-2.onrender.com"
    );
    const { coords } = useContext(CoordsContext);

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

    function clearMap() {
        setToggler(!toggler);
    }

    function getRandomColor() {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    const showImageOfMap = (result) => {
        setLoader(false);
        let coordinates = [];
        for (let i = 0; i < result.length; i++) {
            if (result[i] != "1" && !result[i].bogon && result[i].ip) {
                const [lat, lon] = result[i].loc.split(",");

                let tempLon = lon?.toString().split(".");
                let tempLat = lat?.toString().split(".");

                if (tempLon?.length > 2) {
                    tempLon.pop();
                }
                if (tempLat?.length > 2) {
                    tempLat.pop();
                }

                const newLon = parseFloat(tempLon?.join("."));
                const newLat = parseFloat(tempLat?.join("."));

                let temp = [newLon + i / 1000, newLat + i / 1000];

                [result[i].longitude, result[i].latitude] = temp;
                coordinates.push(temp);

                var popup = new mapboxgl.Popup({
                    className: "custom-popup",
                }).setHTML(
                    `<p>Country: ${result[i].country}</p>
                     <p>Hop: ${i}</p>
                     <p>IP Address: ${result[i].ip}</p>
                     <p>Latitude: ${result[i].latitude} Longitude: ${result[i].longitude}</p>
                     <p>Hostname: ${result[i].hostname}</p>
                     <p>Region: ${result[i].region}</p>
                     <p>Organization: ${result[i].org}</p>
                     <p>ASN: ${result[i].asn}</p>
                     <p>Timezone: ${result[i].timezone}</p>
                     <p>Company Name: ${result[i].company?.name}</p>
                     <p>Company Domain: ${result[i].company?.domain}</p>
                     `
                );

                if (!isNaN(temp[0])) {
                    let marker = new mapboxgl.Marker({
                        color: "blue",
                        rotation: 45,
                    })
                        .setLngLat(temp)
                        .addTo(map)
                        .setPopup(popup);
                }
            }
        }

        setHops(result);

        if (coordinates.length >= 2) {
            const segmentColors = Array.from(
                { length: coordinates.length - 1 },
                getRandomColor
            );

            for (let i = 0; i < coordinates.length - 1; i++) {
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
                    id: `${Math.random()}`,
                    type: "line",
                    source: {
                        type: "geojson",
                        data: segmentGeojson,
                    },
                    paint: {
                        "line-color": segmentColors[i],
                        "line-width": 10,
                        "line-offset": 5,
                    },
                });
            }
        }
    };

    useEffect(() => {
        initializeMap();
        setHops([]);

        return () => {
            if (map) {
                map.remove();
            }
        };
    }, [toggler]);

    useEffect(() => {
        if (map) {
            map.flyTo({
                zoom: 20,
                center: coords,
                speed: 3,
            });
        }
    }, [coords]);

    function isPrivateIPAddress(ip) {
        const privateIPRegex = /^(?:10|127|169\.254|192\.168)\./;
        const privateIPRangeRegex = /^172\.(1[6-9]|2[0-9]|3[0-1])\./;
        const futureUseRangeRegex = /^240\./;

        return (
            privateIPRegex.test(ip) ||
            privateIPRangeRegex.test(ip) ||
            futureUseRangeRegex.test(ip)
        );
    }

    const handleMeasureLatencyClick = async (e) => {
        if (e.key === "Enter" || (e.type === "click" && !loader)) {
            setLoader(true);
            try {
                const hostURL = document.querySelector(".usersHostValue").value;
                setIcon(`https://icon.horse/icon/${hostURL}`);

                const response = await fetch(
                    `https://ipinfo.io?token=fe4a38beab2d32`
                );
                let userDestination = await response.json();
                userDestination = userDestination.ip;

                let hopsResponse = await fetch(server + `/traceroute`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        destination: hostURL,
                        userDestination: userDestination,
                    }),
                });

                if (!hopsResponse.ok) {
                    throw new Error("Failed to fetch traceroute data");
                }

                let hops = await hopsResponse.json();
                let hopsUserDest = [...hops["userDestinationHops"], { ip: "" }];
                let userDestinationHopsArray = await Promise.all(
                    hopsUserDest.map(async (item) => {
                        if (isPrivateIPAddress(item.ip)) {
                            return "1";
                        }
                        try {
                            const response = await fetch(
                                `https://ipinfo.io/${item.ip}?token=fe4a38beab2d32`
                            );
                            return response.json();
                        } catch (err) {
                            return { ip: "" };
                        }
                    })
                );

                let destinationHopsArray = await Promise.all(
                    hops["destinationHops"].map(async (item) => {
                        if (isPrivateIPAddress(item.ip)) {
                            return "1";
                        }
                        try {
                            const response = await fetch(
                                `https://ipinfo.io/${item.ip}?token=fe4a38beab2d32`
                            );
                            return response.json();
                        } catch (err) {
                            return { ip: "" };
                        }
                    })
                );

                let result = [
                    ...userDestinationHopsArray.reverse(),
                    ...destinationHopsArray,
                ];
                showImageOfMap(result);
            } catch (error) {
                console.error(error);
                alert("Wrong IP address or domain name");
            } finally {
                setLoader(false);
            }
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
                <select
                    disabled={loader}
                    onChange={(el) => {
                        setServer(el.target.value);
                    }}
                >
                    <option value="https://traceroutexplorer-web-2.onrender.com">
                        Europe
                    </option>
                    <option value="https://traceroutexplorer-web-southeastasia.onrender.com">
                        South East Asia
                    </option>
                </select>

                <input
                    type="text"
                    className="usersHostValue"
                    placeholder="Enter host URL"
                    onKeyDown={handleMeasureLatencyClick}
                />

                <button disabled={loader} onClick={handleMeasureLatencyClick}>
                    Measure Latency
                </button>
            </div>
            <div className="containerMapSidebar">
                <div className="mapContainer">
                    <button className="clearMap" onClick={clearMap}>
                        Clear map
                    </button>
                    <div
                        className="loader"
                        style={{ display: `${loader ? "flex" : "none"}` }}
                    >
                        <RevolvingDot
                            visible={true}
                            height="80"
                            width="80"
                            color="#4fa94d"
                            ariaLabel="revolving-dot-loading"
                            wrapperStyle={{}}
                            wrapperClass=""
                        />
                    </div>

                    <div
                        id="map"
                        style={{ height: "100%", width: "100%" }}
                    ></div>
                </div>
                <Sidebar hops={hops} icon={icon} />{" "}
            </div>
        </div>
    );
};

export default MapComponent;
