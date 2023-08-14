const TokenQueue = require("./TokenQueue")
const axios = require('axios');

/**
 * The OSSClient is a wrapper around several data sources on open-source software
 * The OSSClient handles:
 * - authentication to the data sources by choosing the correct token type
 * - rate limiting by switching to a new token when the current one is exhausted
 * - pagination by making multiple requests to the data source when necessary
 * - errors by retrying requests that fail due to rate limiting or other errors
 * - caching by storing results in a local database
 * - formatting by returning results in a consistent format
 */
class OSSClient {
		
	tokenQueue = new TokenQueue();
	
	constructor() {}

	dataSources = {
		localhost: {
			endpoint: 'http://localhost:3000',
			token: 'mock_token'
		},
		graphQL: {
				endpoint: 'https://graphql.com',
				token: 'ghauth'
		},
		rest: {
				endpoint: 'https://api.github.com',
				token: 'ghauth'
		},
		bigquery: {
				endpoint: 'https://bigquery.googleapis.com/bigquery/v2/projects/YOUR_PROJECT_ID/queries',
				token: 'gcloudauth'
		},
		codesearch: {
			endpoint: 'https://api.ossinsight.io/v1',
			token: 'ghauth'
		},
		// OSSInsights Public API has no authentication yet, but rate limits to 600 requests/hour/IP address
		// Docs: https://ossinsight.io/docs/api
		ossinsights: {
			endpoint: 'https://api.ossinsight.io/v1',
			token: 'none'
	 	}
	}
	
	makeBigQueryRequest = async () => {
			const userId = 93455288;
			const startYear = 20;
			const endYear = 23;

			const query = `SELECT DISTINCT repo.url FROM githubarchive.year.20* WHERE type IN ('PushEvent', 'PullRequestEvent') AND (_TABLE_SUFFIX BETWEEN '${startYear}' AND '${endYear}') AND actor.id = ${userId}`;

			try {
					const response = await axios.post(
							'https://bigquery.googleapis.com/bigquery/v2/projects/YOUR_PROJECT_ID/queries',
							{
									query: query,
									useLegacySql: false
							},
							{
									headers: {
											Authorization: `Bearer ${accessToken}`,
											'Content-Type': 'application/json'
									}
							}
					);

					const results = response.data;
					// Process the results as needed
					console.log(results);
			} catch (error) {
					console.error('Error making BigQuery request:', error);
			}
	};

  makeRequest = async (url, dataSourceKey) => {
    if (!this.dataSources.hasOwnProperty(dataSourceKey)) {
      throw new Error('Invalid data source key');
    }

    const dataSource = this.dataSources[dataSourceKey];
    const authToken = this.tokenQueue.getToken(); // Get the first token from the deque

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Request failed: ${error.message}`);
    }
  };

}

// Example usage
const client = new OSSClient();
const dataSourceKey = 'localhost';
const url = client.dataSources[dataSourceKey].endpoint;

client.makeRequest(url, dataSourceKey)
  .then(data => {
    console.log('Response:', data);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });