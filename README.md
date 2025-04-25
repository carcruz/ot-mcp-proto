# Open Targets MCP Server

A Model Context Protocol integration for the Open Targets Platform API, enabling AI assistants to access bioinformatics data through structured tools.

> **Note:** This project is an _exploratory and personal implementation_ of an Open Targets MCP server.  
> It serves as a sandbox for testing architectural ideas, tool integrations, and novel interactions within the MCP ecosystem, with the aim of informing future directions for official Open Targets tools.

## Overview

This project bridges the gap between AI assistants and the Open Targets Platform by implementing the Model Context Protocol (MCP). It allows language models to query biomedical data in a structured, programmatic way, enhancing their ability to provide accurate information about target-disease associations and biological data.

## What is MCP?

The Model Context Protocol is an open standard for communication between AI assistants and external tools or services. It allows models to:

- Access real-time data sources
- Perform structured operations with external systems
- Process requests and return responses in a standardized format

MCP enables AI models to overcome their knowledge cutoff limitations by providing a structured interface to external data and functionality.

## What is Open Targets?

Open Targets is a public-private partnership that uses human genetics and genomics data for systematic drug target identification and prioritization. The Open Targets Platform integrates datasets to help researchers identify and prioritize drug targets based on the strength of their association with diseases.

## Features

- **Structured API Access**: Query Open Targets data through a standardized MCP interface
- **Target-Disease Associations**: Retrieve evidence-based associations between genetic targets and diseases
- **GraphQL Integration**: Leverages the Open Targets GraphQL API for efficient data retrieval
- **Extensible Design**: Easy to add new tools and capabilities

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ts-mcp

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

## Configuration

Configure the server by editing the `.env` file:

```
# Server configuration
PORT=3000
LOG_LEVEL=info
ENABLE_CORS=true
MCP_DEBUG=false

# Open Targets API configuration
OPEN_TARGETS_API=https://api.platform.opentargets.org/api/v4/graphql
```

## Integrating with AI Clients

To make the Open Targets MCP server available to AI clients that support the Model Context Protocol (e.g., OpenAI GPTs or other compatible agents), add the following configuration to your MCP client setup:

```json
"opentargets": {
  "command": "npx",
  "args": ["-y", "tsx", "~/ot-mcp-proto/src/main.ts"]
}
```

**Notes:**

- Replace the path (~/ot-mcp-proto/src/main.ts) with the appropriate path to the entry file on your system.
- This configuration assumes you have tsx and other project dependencies installed locally.
- If you’re running the MCP server in a different environment (e.g. Docker, remote host), adjust the command and args accordingly.

## Available Tools

### target_disease_associations

Retrieves disease associations for a specific target.

**Parameters:**

- `targetId` (string): Ensembl gene ID (e.g., ENSG00000157764)
- `page` (object, optional): Pagination parameters
  - `index` (number): Page index (zero-based)
  - `size` (number): Number of results per page
- `orderByScore` (string): Order results by association score or datasource
- `dataTypes` (array of strings, optional): Filter by data types (e.g., genetic_association, somatic_mutation)
- `datasources` (array of strings, optional): Filter by data sources (e.g., europepmc, eva)
- `therapeuticAreas` (array of strings, optional): Filter by therapeutic areas
- `diseaseFilters` (array of strings, optional): Filter diseases by categories
- `direct` (boolean, optional): If true, returns only direct associations
- `scoreThreshold` (number, optional): Minimum score threshold for associations (0.0 to 1.0)
- `includeDiseaseDetails` (boolean, optional): Whether to include detailed disease information
- `Bs` (array of strings, optional): List of specific disease IDs to filter by
- `enableIndirect` (boolean, optional): Utilize target interactions to retrieve all associated diseases
- `facetFilters` (array of strings, optional): List of facet IDs to filter by (using AND)
- `BFilter` (string, optional): Filter to apply to IDs with string prefixes

**Example Usage:**

```json
{
  "targetId": "ENSG00000157764",
  "page": {
    "index": 0,
    "size": 10
  },
  "orderByScore": true,
  "scoreThreshold": 0.5,
  "direct": true,
  "enableIndirect": false,
  "includeDiseaseDetails": true
}
```

## Usage

### Running in StdioServerTransport Mode

This mode is ideal for integrating with AI platforms that support the MCP protocol.

```bash
npm run stdio
```

### Debugging with MCP Inspector

```bash
npm run debug
```

## Development

### Project Structure

- `src/main.ts`: Main entry point and MCP server configuration
- `src/graphql.ts`: GraphQL queries and client configuration
- `src/config.ts`: Configuration loading from environment variables

### Adding New Tools

To add a new tool, follow this pattern in `main.ts`:

```typescript
mcpServer.tool(
  "tool_name",
  {
    // Parameter schema using zod
    param1: z.string().describe("Parameter description"),
    // More parameters...
  },
  async ({ param1, param2 }) => {
    // Tool implementation
    // Process parameters and call Open Targets API
    // Return result in MCP format
  }
);
```

## Future Enhancements

- Add tools for querying drug information
- Support disease-target associations (reverse lookup)
- Implement pathway analysis tools
- Add visualization capabilities for association data

## Dependencies

- `@modelcontextprotocol/sdk`: MCP TypeScript SDK
- `graphql-request`: GraphQL client for API communication
- `zod`: Schema validation
- `dotenv`: Environment configuration

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgements

- [Open Targets Platform](https://platform.opentargets.org/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [EMBL-EBI](https://www.ebi.ac.uk/)

"oepntargets": {
"command": "npx",
"args": ["-y", "tsx", "/Users/carlos_cruz/projects/ot/ts-mcp/src/main.ts"]
}
