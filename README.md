# Verex AI Test Runner

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/verex-ai/github-test-runner)](https://github.com/verex-ai/github-test-runner/releases)
[![License](https://img.shields.io/github/license/verex-ai/github-test-runner)](https://github.com/verex-ai/github-test-runner/blob/main/LICENSE)

Run Verex AI test suites directly in your GitHub workflow. This action allows you to execute your test suites, monitor their progress, and report results all within your CI/CD pipeline.

## Features

- Execute Verex AI test suites from GitHub Actions
- Automatic polling until test completion
- Detailed output of test results
- Simple integration with existing workflows
- Debug mode for troubleshooting

## Usage

Add the following step to your GitHub Actions workflow file:

```yaml
- name: Run QA Tests
  uses: verex-ai/github-test-runner@v1
  with:
    api_key: ${{ secrets.VEREX_API_KEY }}
    test_suite: 'suite_abc123456'
```

## API Key

The API key must be stored in a GitHub secret. You can create a new secret in your repository settings or use the `VEREX_API_KEY` environment variable.

## Obtaining the API Key

The API key can be found in the [Verex Dashboard](https://verex.ai/app).
Go to Settings > API Keys and create a new key.

## Complete Example

See [example-workflow.yml](./example-workflow.yml) for a complete example that you can copy and adapt for your own workflows.

```yaml
# Excerpt from example-workflow.yml
- name: Run QA Tests
  uses: verex-ai/github-test-runner@v1
  with:
    api_key: ${{ secrets.API_KEY }}
    test_suite: 'testsuite_123456'
    debug: 'true'
  id: test_results

- name: Report Test Results
  if: always()
  run: |
    echo "Passed: ${{ steps.test_results.outputs.passed_tests }}"
    echo "Failed: ${{ steps.test_results.outputs.failed_tests }}"
```

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `api_key` | Verex AI API key | Yes | |
| `test_suite` | ID of the test suite to run | Yes | |
| `api_base_url` | Base URL for the Verex API | No | `https://verex.ai/api` |
| `poll_interval_seconds` | Time in seconds between status checks | No | `10` |
| `timeout_seconds` | Maximum time to wait for test completion | No | `3600` |
| `debug` | Enable debug logging | No | `false` |
| `fail_on_test_failure` | Whether to fail the GitHub Action if tests fail | No | `true` |

## Outputs

| Name | Description |
|------|-------------|
| `total_tests` | Total number of tests executed |
| `passed_tests` | Number of tests that passed |
| `failed_tests` | Number of tests that failed |
| `test_duration` | Duration of the test run in seconds |
| `test_suite_link` | Link to the test suite in Verex AI dashboard |
| `test_suite_run_id` | ID of the test suite run |
| `test_suite_run_status` | Final status of the test suite run |

## Requirements

- A Verex AI account with API access
- Valid API key with permissions to run test suites

## Setup

1. Create a new secret in your GitHub repository named `API_KEY` with your Verex AI API key
2. Add the action to your workflow file as shown in the examples
3. Configure the inputs according to your needs

## Troubleshooting

If you encounter issues, enable the `debug` option to see more detailed logs. Common issues include:

- Invalid API key
- Non-existent test suite ID
- Network connectivity problems
- Timeouts (increase `timeout_seconds` for longer-running tests)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.