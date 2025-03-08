const axios = require("axios");
const fs = require("fs");

// Configuration from environment variables
const API_KEY = (process.env.API_KEY || "").trim();
const TEST_SUITE_ID = (process.env.TEST_SUITE_ID || "").trim();
const TEST_BASE_URL = (process.env.TEST_BASE_URL || "").trim();
const API_BASE_URL =
  (process.env.API_BASE_URL || "").trim() || "https://verex.ai/api";
const MAX_POLL_ATTEMPTS = parseInt(
  (process.env.MAX_POLL_ATTEMPTS || "60").trim()
);
const POLL_INTERVAL_SECONDS = parseInt(
  (process.env.POLL_INTERVAL_SECONDS || "10").trim()
);
const DEBUG = (process.env.DEBUG || "false").toLowerCase().trim() === "true";

// GitHub Actions output file
const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT;

// API headers
const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

/**
 * Set GitHub Actions output
 */
function setOutput(name, value) {
  if (GITHUB_OUTPUT) {
    if (DEBUG) {
      console.log(`Setting output ${name}=${value}`);
    }
    fs.appendFileSync(GITHUB_OUTPUT, `${name}=${value}\n`);
  }
}

/**
 * Start the test suite
 */
async function queueTests() {
  try {
    console.log(`Starting test suite: ${TEST_SUITE_ID}`);

    const data = {};
    if (TEST_BASE_URL) {
      data.url = TEST_BASE_URL;
    }
    if (DEBUG) {
      console.log(`Queueing tests with data: ${JSON.stringify(data)}`);
    }

    const apiUrl = `${API_BASE_URL}/apiRunners/runTestSuite/${TEST_SUITE_ID}`;
    if (DEBUG) {
      console.log(`Queueing tests using API: ${apiUrl}`);
    }
    const response = await axios.post(apiUrl, data, { headers });

    // Record start time for duration calculation
    setOutput("start_time", Date.now().toString());

    return response.data;
  } catch (error) {
    console.error(
      "Failed to queue tests:",
      error.response?.data || error.message
    );
    process.exit(1);
  }
}

/**
 * Get the test suite run details
 */
async function getTestSuiteRun(runId, includeTestRuns = false) {
  try {
    const apiUrl = `${API_BASE_URL}/apiRunners/testSuiteRun/${runId}?includeTestRuns=${
      includeTestRuns ? "true" : "false"
    }`;
    if (DEBUG) {
      console.log(`Checking test status using API: ${apiUrl}`);
    }
    const response = await axios.get(apiUrl, { headers });
    return response.data;
  } catch (error) {
    console.error(
      "Failed to check test status:",
      error.response?.data || error.message
    );
    process.exit(1);
  }
}

/**
 * Sleep function to wait between polling attempts
 */
function sleep(seconds) {
  if (DEBUG) {
    console.log(`Sleeping for ${seconds} seconds`);
  }
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

/**
 * Poll until tests complete or timeout
 */
async function pollUntilComplete(runId) {
  console.log(`Polling for test completion: ${runId}`);

  let attempts = 0;

  while (attempts < MAX_POLL_ATTEMPTS) {
    attempts++;

    const testSuiteRunResponse = await getTestSuiteRun(runId, true);
    const status = testSuiteRunResponse.testSuiteRun.status;
    console.log(
      `Poll attempt ${attempts}/${MAX_POLL_ATTEMPTS}: Status - ${status}`
    );

    if (status === "COMPLETED") {
      if (DEBUG) {
        console.log(`Tests completed: ${JSON.stringify(status)}`);
      }
      return status;
    } else if (status === "FAILED" || status === "ERROR") {
      console.error("Tests failed or encountered an error:", status);
      setOutput("test_status", "FAILED");
      process.exit(1);
    }

    // Continue polling if still in progress
    await sleep(POLL_INTERVAL_SECONDS);
  }

  console.error(`Timed out after ${attempts} attempts`);
  setOutput("test_status", "TIMEOUT");
  process.exit(1);
}

/**
 * Process the test results
 */
function processResults(testSuiteRun, testRuns) {
  const totalTests = testRuns.length;
  const passed = testRuns.filter(
    (testRun) => testRun.status === "PASSED"
  ).length;
  const failed = testRuns.filter(
    (testRun) => testRun.status === "FAILED"
  ).length;
  const skipped = testRuns.filter(
    (testRun) => testRun.status === "SKIPPED"
  ).length;

  console.log("\n============ TEST RESULTS ============");
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log("======================================\n");

  // Calculate test duration
  const startTime = parseInt(process.env.start_time || Date.now());
  const endTime = Date.now();
  const duration = Math.floor((endTime - startTime) / 1000);

  // Set GitHub workflow output variables
  setOutput("total_tests", totalTests.toString());
  setOutput("passed_tests", passed.toString());
  setOutput("failed_tests", failed.toString());
  setOutput("test_duration", duration.toString());
  setOutput("test_status", testSuiteRun.status);

  // Exit with error if any tests failed
  if (failed > 0) {
    console.error(`${failed} test(s) failed`);
    process.exit(1);
  }
}

function validateInputs() {
  if (DEBUG) {
    console.log(`Validating inputs`);
  }
  if (!API_KEY) {
    throw new Error("'api_key' is not set");
  }

  if (!TEST_SUITE_ID) {
    throw new Error("'test_suite' is not set");
  }

  if (DEBUG) {
    console.log(`Inputs validated`);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Validate inputs
    validateInputs();

    // Step 1: Queue the tests
    /**
     * {
     *  testSuiteRun: {
     *    id: string,
     *    status: 'PENDING'|'RUNNING'|'COMPLETED'|'FAILED',
     *  },
     *  testRuns: testRuns.map((testRun) => ({
     *    id: string,
     *    status: 'PENDING'|'RUNNING'|'COMPLETED'|'FAILED',
     *  }
     * }
     */
    const runTestSuiteResponse = await queueTests();
    const runId = runTestSuiteResponse.testSuiteRun.id;
    if (DEBUG) {
      console.log(`Test suite run ID: ${runId}`);
    }

    // Step 2 & 3: Poll until completion or timeout
    const testSuiteRunStatus = await pollUntilComplete(runId);

    let results = null;
    if (testSuiteRunStatus === "COMPLETED") {
      // Step 4: Process results
      results = await getTestSuiteRun(runId, true);
    }

    processResults(results.testSuiteRun, results.testRuns);

    console.log("All tests passed successfully");
  } catch (error) {
    console.error("Error executing tests:", error);
    setOutput("test_status", "ERROR");
    process.exit(1);
  }
}

// Run the main function
main();
