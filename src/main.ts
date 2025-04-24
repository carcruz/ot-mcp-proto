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
      .optional()
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
          // @ts-ignore
          id: response.target.id,
          // @ts-ignore
          symbol: response.target.approvedSymbol,
          // @ts-ignore
          name: response.target.approvedName,
          // @ts-ignore
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

// Register the disease evidence tool
mcpServer.tool(
  "disease_evidence",
  {
    diseaseId: z
      .string()
      .describe("EFO disease ID (e.g., EFO_0000253)")
      .default("EFO_0006335"),
    ensemblId: z
      .string()
      .describe("Ensembl gene ID (e.g., ENSG00000157764)")
      .default("ENSG00000091157"),
    datasourceIds: z
      .array(z.string())
      .optional()
      .describe(
        "Filter by evidence data sources (e.g., gwas_credible_sets, chembl, cancer_biomarkers)"
      )
      .default(["gwas_credible_sets"]),
    enableIndirect: z
      .boolean()
      .default(true)
      .describe(
        "Utilize target interactions to retrieve all associated diseases"
      ),
    size: z.number().default(10).describe("Number of results per page"),
  },
  async ({ diseaseId, ensemblId, datasourceIds, enableIndirect, size }) => {
    try {
      // Prepare variables for GraphQL query
      const variables: Record<string, any> = {
        diseaseId,
        ensemblId,
        datasourceIds,
        enableIndirect,
        size,
      };

      // Remove undefined values
      Object.keys(variables).forEach((key) => {
        if (variables[key] === undefined) {
          delete variables[key];
        }
      });

      const response = await graphqlClient.request(
        queries.diseaseEvidence,
        variables
      );

      // Format the response
      // @ts-ignore
      const disease = response.disease;
      const evidences = disease.evidences;

      // Create a summary
      const summary = {
        disease: {
          id: disease.id,
          name: disease.name,
        },
        evidence: {
          count: evidences.count,
          returned: evidences.rows.length,
        },
      };

      // Process the evidence rows to make them more readable
      const formattedEvidences = evidences.rows.map((evidence) => {
        const formattedEvidence = {
          id: evidence.id,
          score: evidence.score,
          dataType: evidence.dataType,
          datasource: evidence.datasourceId,
          target: {
            id: evidence.target.id,
            symbol: evidence.target.approvedSymbol,
            name: evidence.target.approvedName,
          },
          disease: {
            id: evidence.disease.id,
            name: evidence.disease.name,
          },
          source: evidence.source
            ? {
                name: evidence.source.name,
                url: evidence.source.url,
              }
            : null,
        };

        // Add literature information if available
        if (evidence.literature && evidence.literature.pubmedId) {
          formattedEvidence["literature"] = {
            pubmedId: evidence.literature.pubmedId,
            title: evidence.literature.title,
          };
        }

        // Add text mining sentences if available
        if (
          evidence.textMiningSentences &&
          evidence.textMiningSentences.length > 0
        ) {
          formattedEvidence["textMining"] = evidence.textMiningSentences.map(
            (sentence) => ({
              text: sentence.text,
              matchedTerms: sentence.matchingObjs
                ? sentence.matchingObjs.map((obj) => ({
                    type: obj.type,
                    term: obj.term,
                  }))
                : [],
            })
          );
        }

        return formattedEvidence;
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                summary,
                evidences: formattedEvidences,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error("Disease evidence error:", error);
      throw new Error(
        `Failed to fetch evidence for disease ${diseaseId}: ${
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
