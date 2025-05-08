// @ts-nocheck
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { graphqlClient, queries } from "./graphql";

// Initialize the MCP server with our basic information
const mcpServer = new McpServer({
  name: "Open Targets Platform",
  version: "1.0.0",
  description:
    "Access to Open Targets Platform data for target-disease associations and drug information",
});

// Register the targetAssociatedDiseases tool with all parameters
mcpServer.tool(
  "target_disease_associations",
  {
    targetId: z.string().describe("Ensembl gene ID (e.g., ENSG00000157764)"),
    page: z
      .object({
        index: z.number().default(0).describe("Page index (zero-based)"),
        size: z.number().default(10).describe("Number of results per page"),
      })
      .describe("Pagination parameters"),
    orderByScore: z
      .string()
      .default("score")
      .describe("Order results by datasource or score - score is default"),
    Bs: z.array(z.string()).optional().describe("Fitler by list of disease"),
    datasources: z
      .nullable(
        z.array(
          z.object({
            id: z.string().describe("Page index (zero-based)"),
            weight: z.number().describe("Number of results per page"),
            propagate: z.boolean(),
            required: z.boolean().default(false),
          })
        )
      )
      .default(null)
      .describe("List of datasource settings"),
    enableIndirect: z
      .boolean()
      .default(false)
      .describe(
        "Utilize target interactions to retrieve all associated diseases"
      ),
    includeDiseaseDetails: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Utilize target interactions to retrieve all associated diseases"
      ),
    facetFilters: z
      .array(z.string())
      .optional()
      .describe("List of facet IDs to filter by (using AND)"),
    BFilter: z
      .string()
      .default("")
      .describe("Filter to apply to the IDs with string prefixes"),
  },
  async ({
    targetId,
    page,
    orderByScore,
    datasources,
    Bs,
    enableIndirect,
    facetFilters,
    BFilter,
    includeDiseaseDetails,
  }) => {
    try {
      // Prepare variables for GraphQL query
      const variables: Record<string, any> = {
        targetId,
        page,
        orderByScore,
        datasources,
        Bs,
        enableIndirect,
        facetFilters,
        BFilter,
      };

      // Remove undefined values
      Object.keys(variables).forEach((key) => {
        if (variables[key] === undefined) {
          delete variables[key];
        }
      });

      const response = await graphqlClient.request(
        queries.targetAssociatedDiseases,
        variables
      );

      // Format the response
      // @ts-ignore
      const associatedDiseases = response.target.associatedDiseases;

      // Create a summary
      const summary = {
        target: {
          id: response.target.id,
          symbol: response.target.approvedSymbol,
          name: response.target.approvedName,
          biotype: response.target.biotype,
        },
        diseaseAssociations: {
          count: associatedDiseases.count,
          returned: associatedDiseases.rows.length,
        },
      };

      // Process the disease rows
      const formattedRows = associatedDiseases.rows.map((row) => {
        const formatted = {
          disease: {
            id: row.disease.id,
            name: row.disease.name,
          },
          overallScore: row.score,
          // Extract data source scores
          evidenceScores: row.datasourceScores
            ? row.datasourceScores.map((ds) => ({
                source: ds.id,
                score: ds.score,
              }))
            : [],
        };

        // Add additional disease details if requested
        if (includeDiseaseDetails) {
          formatted.disease["description"] = row.disease.description;
          formatted.disease["therapeuticAreas"] = row.disease.therapeuticAreas;
        }

        return formatted;
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                summary,
                associations: formattedRows,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Target associated diseases error:", error);
      throw new Error(
        `Failed to fetch associated diseases for target ${targetId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
);

// Create and start the StdioServerTransport
const transport = new StdioServerTransport();
// Connect the transport to the MCP server
mcpServer.connect(transport);
