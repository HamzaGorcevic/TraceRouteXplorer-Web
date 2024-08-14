export const fetchTracerouteData = async (server, hostURL) => {
    const response = await fetch(`https://ipinfo.io?token=fe4a38beab2d32`);
    let userDestination = await response.json();
    userDestination = userDestination.ip;

    const hopsResponse = await fetch(`${server}/traceroute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination: hostURL, userDestination }),
    });

    if (!hopsResponse.ok) {
        throw new Error("Failed to fetch traceroute data");
    }

    const hops = await hopsResponse.json();
    const hopsUserDest = [...hops["userDestinationHops"], { ip: "" }];
    const userDestinationHopsArray = await fetchIpInfo(hopsUserDest);
    const destinationHopsArray = await fetchIpInfo(hops["destinationHops"]);

    return [...userDestinationHopsArray.reverse(), ...destinationHopsArray];
};

export const fetchIpInfo = async (hops) => {
    return await Promise.all(
        hops.map(async (item) => {
            if (isPrivateIPAddress(item.ip) || item.ip == 1) {
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
};

export const isPrivateIPAddress = (ip) => {
    const parts = ip.split(".");
    return (
        parts[0] === "10" ||
        (parts[0] === "172" && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === "192" && parts[1] === "168")
    );
};

export const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};
