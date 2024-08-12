const { exec } = require("child_process");

function getListOfHops(destination, userDestination) {
    return Promise.all([
        executeTraceroute(destination),
        executeTraceroute(userDestination),
    ])
        .then(([destinationHops, userDestinationHops]) => ({
            destinationHops,
            userDestinationHops,
        }))
        .catch((error) => {
            throw new Error(`Error in traceroute: ${error.message}`);
        });
}

function executeTraceroute(destination) {
    return new Promise((resolve, reject) => {
        exec(`traceroute ${destination}`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }

            // Parse the output of traceroute
            console.log(`Traceroute to ${destination}:`, stdout.toString());
            const lines = stdout.toString().split("\n");
            const hops = parseTracerouteOutput(lines);
            resolve(hops);
        });
    });
}

function parseTracerouteOutput(lines) {
    if (process.platform === "win32") {
        return WindowsExec(lines);
    } else {
        return LinuxExec(lines);
    }
}

function WindowsExec(lines) {
    const hops = lines
        .slice(4, -1) // Start from the 5th line and exclude the last line
        .map((line) => {
            const parts = line.trim().split("  ");
            const hop = parseInt(parts[0], 10);
            let address = parts[parts.length - 1];

            if (address.length > 20) {
                const regex = /\[([^\]]+)\]/;
                const match = address.match(regex);
                address = match[1];
            }

            const rttValues = parts
                .slice(1, -1)
                .map((value) => {
                    if (value === "*") {
                    } else {
                        return value;
                    }
                })
                .filter((value) => value !== undefined);
            return {
                hop,
                ip: address,
                rtt1: rttValues[0] || null,
                rtt2: rttValues[1] || null,
                rtt3: rttValues[2] || null,

                // Add more RTT properties as needed
            };
        });
    return hops;
}
function LinuxExec(lines) {
    lines.shift();
    const result = [];

    // Iterate over each line in the input string
    lines.forEach((line) => {
        // Extracting the hop number, IP address, and round-trip times
        const [hop, ipField, ...rtt] = line.trim().split("  ");
        let ip = ipField;
        if (ip && ip.length > 5) {
            const regex = /\((.*?)\)/;
            const match = ip.match(regex);
            ip = match ? match[1] : ip;
        } else {
            ip = "1";
        }
        const traceRouteObj = {
            hop: hop,
            ip: ip,
            rtt1: rtt[0] || null,
            rtt2: rtt[1] || null,
            rtt3: rtt[2] || null,
        };

        // Pushing the object to the result array
        result.push(traceRouteObj);
    });

    return result;
}
module.exports = {
    getListOfHops,
};
