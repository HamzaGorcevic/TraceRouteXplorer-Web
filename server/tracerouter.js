const { exec } = require("child_process");

function getListOfHops(destination) {
    return new Promise((resolve, reject) => {
        exec(`tracert ${destination}`, (error, stdout, stderr) => {
            // exec(`traceroute -I ${destination}`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }

            // Parse the output of traceroute
            console.log("STDOUT :", stdout.toString());

            const lines = stdout.toString().split("\n");
            const hops = WindowsExec(lines);
            console.log("HOPS: ", hops);

            resolve(hops);
        });
    });
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
            console.log("parts: ", parts, "address:", address);

            const rttValues = parts
                .slice(1, -1)
                .map((value) => {
                    if (value === "*") {
                    } else {
                        return value;
                    }
                })
                .filter((value) => value !== undefined);
            console.log("rttValues", rttValues);
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
    console.log("LINES:", lines);

    const result = [];

    // Iterate over each line in the input string
    lines.forEach((line) => {
        // Extracting the hop number, IP address, and round-trip times
        const [hop, ip, ...rtt] = line.trim().split("  ");

        console.log("line:", line, "\n", "ip:", ip);

        if (ip && ip.length > 20) {
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
