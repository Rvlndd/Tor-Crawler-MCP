import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express, { Request, Response } from 'express';
import { z } from 'zod';
import torRequest from 'tor-request';
import * as cheerio from 'cheerio';

const server = new McpServer({
    name: 'tor-crawler-server',
    version: '1.1.0'
});

interface CrawlOutput {
    content: string;
}

function extractMarkdown(body: string): string {
    const $ = cheerio.load(body);
    $('script, style, noscript, iframe, nav, footer, header').remove();
    
    const title = $('title').first().text().trim() || 'Untitled Page';
    let markdown = `# ${title}\n\n`;
    
    const bodyText = $('body').text()
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n\n');
    
    markdown += bodyText + '\n\n';
    
    const links: string[] = [];
    $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (!href) return;
        if (href.startsWith('http') || href.includes('.onion'))
            links.push(`${text ? text + ': ' : ''}${href}`);
    });
    
    if (links.length > 0) {
        markdown += `\n## Links:\n`;
        for (const link of links) markdown += `- ${link}\n`;
    }
    
    return markdown.trim();
}

server.registerTool(
    'crawl-tor',
    {
        title: 'Tor Crawler',
        description: 'Crawl a Tor website and i will give you the full webpage to you, and its up to you to explain that, please explain all.',
        inputSchema: { url: z.string().url() },
        outputSchema: { content: z.string() }
    },
    async ({ url }: { url: string }) => {
        return new Promise<{ content: Array<{ type: string; text: string }>; structuredContent: CrawlOutput }>((resolve, reject) => {
            torRequest.request(url, (err: Error | null, res: any, body: string) => {
                if (err || res.statusCode !== 200) {
                    console.error('Error crawling Tor website:', err);
                    reject(err || new Error(`Status code: ${res?.statusCode}`));
                    return;
                }
                const markdown = extractMarkdown(body);
                const output: CrawlOutput = { content: markdown };
                resolve({
                    content: [{ type: 'text', text: markdown }],
                    structuredContent: output
                });
            });
        });
    }
);

const app = express();
app.use(express.json());

app.post('/mcp', async (req: Request, res: Response) => {
    const transport = new StreamableHTTPServerTransport({
        enableJsonResponse: true
    });
    res.on('close', () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
});

const port = 3000;
app.listen(port, () => {
    console.log(`Tor Crawler MCP Server running on http://localhost:${port}/mcp`);
}).on('error', (error: Error) => {
    console.error('Server error:', error);
    process.exit(1);
});
