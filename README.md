## Tor Crawler MCP

A simple **Model Context Protocol (MCP)** server for crawling **Tor (.onion)** sites and extracting their content.

---

# Requirements

You must have the **Tor Expert Bundle** installed and running.

👉 Download it here:  
[https://www.torproject.org/download/tor/](https://www.torproject.org/download/tor/)

After installation, run:
tor.exe

# Example Configuration
```json
"mcpServers": {
  "tor-crawler-server": {
    "httpUrl": "http://localhost:3000/mcp",
    "trust": true,
    "timeout": 60000
  }
}
```



This project is licensed under the MIT License, see the [LICENSE](https://github.com/Rvlndd/Tor-Crawler-MCP/blob/main/LICENSE) file for details.
