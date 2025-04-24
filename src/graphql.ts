import { GraphQLClient } from "graphql-request";
import { config } from "./config";

// Initialize GraphQL client
export const graphqlClient = new GraphQLClient(config.openTargetsApiUrl);

// GraphQL queries
export const queries = {
  // Target details query
  target: `
    query TargetInfo($targetId: String!) {
      target(ensemblId: $targetId) {
        id
        approvedSymbol
        approvedName
        biotype
        functionDescriptions
        targetClass {
          id
          label
        }
      }
    }
  `,

  // Target associated diseases query with all parameters
  targetAssociatedDiseases: `
    query TargetAssociatedDiseases(
      $targetId: String!,
      $page: Pagination,
      $orderByScore: String!, 
      $datasources: [DatasourceSettingsInput!],
      $Bs: [String!],
      $enableIndirect: Boolean!,
      $facetFilters: [String!],
      $BFilter: String!
    ) {
      target(ensemblId: $targetId) {
        id
        approvedSymbol
        approvedName
        biotype
        associatedDiseases(
          page: $page, 
          orderByScore: $orderByScore, 
          datasources: $datasources, 
          Bs: $Bs,
          enableIndirect: $enableIndirect,
          facetFilters: $facetFilters,
          BFilter: $BFilter
        ) {
          count
          rows {
            disease {
              id
              name
              description
              therapeuticAreas {
                id
                name
              }
            }
            score
            datasourceScores {
              id
              score
            }
          }
        }
      }
    }
  `,

  // Disease evidence query
  diseaseEvidence: `
    query DiseaseEvidence(
      $diseaseId: String!, 
      $ensemblId: String!,
      $datasourceIds: [String!],
      $enableIndirect: Boolean!,
      $size: Int!
    ) {
      target(ensemblId: $ensemblId) {
        approvedSymbol
      }
      disease(efoId: $diseaseId) {
        id
        name
        evidences(
          ensemblIds: [$ensemblId]
          enableIndirect: $enableIndirect
          datasourceIds: $datasourceIds
          size: $size
        ) {
          count
          rows {
            id
            score
            datasourceId
            target {
              id
              approvedSymbol
              approvedName
            }
            disease {
              id
              name
            }
          }
        }
      }
    }
  `,
};
