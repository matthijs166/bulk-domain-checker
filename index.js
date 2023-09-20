const fs = require('fs');
const whoiser = require('whoiser')

// Read a list of domains from a file, one domain per line
const domainsFile = 'domainsToCheck.txt';

fs.readFile(domainsFile, 'utf8', async (err, data) => {
  if (err) {
    console.error(`Error reading file ${domainsFile}: ${err}`);
    return;
  }

  const domains = data.split('\n').map(domain => domain.trim());

  // Check if each domain is available
  const checked = await checkDomains(domains);

  // get the freeDomains.json file
  const freeDomainsFile = require('./freeDomains.json');

  
  // merge the free domains with the new free domains
    const newFreeDomains = [...freeDomainsFile, ...checked];
    // remove duplicates
    const uniqueFreeDomains = [...new Set(newFreeDomains)];

    // write the new free domains to the file
    fs.writeFile('freeDomains.json', JSON.stringify(uniqueFreeDomains, null, 2), err => {
        if (err) {
            console.error(`Error writing file ${freeDomainsFile}: ${err}`);
            return;
        }
        console.log(`Successfully wrote ${uniqueFreeDomains.length} domains to ${freeDomainsFile}`);
    })
  

});

async function checkDomains(domains) {
    const freeDomains = [];
    for (domain of domains) {
        // skip empty lines
        if (!domain) continue;
        const result = await whois(domain);
        let regex = /Status:\s+(.*)active/;
        
        if (result.match(regex)) {
            console.log(`${domain} is not available`);
            continue
        }

        let regex2 = /free/;
        if (result.match(regex2)) {
            freeDomains.push(domain);
            console.log(`${domain} is available`);
        }
    }
    return freeDomains;
}

async function whois(domain){
    const result = await whoiser.domain(domain, {
        // host: server,
        timeout: 1500,
        raw: true,

    });
    const raw = result['whois.domain-registry.nl'].__raw
    // if raw has requests per second exceeded call again and wait 1 second
    if (raw.match(/Requests per second exceeded/)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return whois(domain);
    }

    return raw;
}