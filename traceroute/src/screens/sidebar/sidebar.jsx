import React, { useContext } from "react";
import "./sidebar.css";
import { CoordsContext } from "../../contex";

const Sidebar = (data) => {
    const { setCoords } = useContext(CoordsContext);

    const hops = data.hops;
    return (
        <div className="sidebar">
            {hops.length > 1 ? (
                <>
                    <div className="logo">
                        <img src={data.icon} alt="Logo" />
                    </div>
                    <div className="items">
                        {hops.map((hop, index) => (
                            <div
                                key={index}
                                className="hop"
                                onClick={() => {
                                    if (hop.latitude) {
                                        setCoords([
                                            hop.longitude,
                                            hop.latitude,
                                        ]);
                                    }
                                }}
                            >
                                <div className="hop-number">{index + 1}</div>
                                <div className="hop-info">
                                    <div className="country">
                                        {hop?.country}
                                    </div>
                                    <div className="city">{hop?.city}</div>
                                    {hop.query === "Request timed out." ? (
                                        <div className="ip-timeout">
                                            {hop.query}
                                        </div>
                                    ) : (
                                        <>
                                            {hop.latitude && hop.longitude ? (
                                                <div className="lat-long">
                                                    <div className="ip">
                                                        IP: {hop?.ip}
                                                    </div>
                                                    <div className="timezone">
                                                        Timezone:{" "}
                                                        {hop?.timezone}
                                                    </div>
                                                    Lat: {hop?.latitude}, Lon:{" "}
                                                    {hop?.longitude}
                                                </div>
                                            ) : (
                                                <div className="private-ip">
                                                    This IP address is private
                                                    and cannot be shown on the
                                                    map.
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <h3>Result of hops will be shown in this table :)</h3>
            )}
        </div>
    );
};

export default Sidebar;
