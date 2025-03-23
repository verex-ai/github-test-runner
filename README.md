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
    api_key: ${{ secrets.VEREX_API_KEY }}
    test_suite: 'testsuite_123456'
    debug: 'true'
  id: test_results

- name: Report Test Results
  if: always()
  run: |
    echo "Passed: ${{ steps.test_results.outputs.passed_tests }}"
    echo "Failed: ${{ steps.test_results.outputs.failed_tests }}"
```

## Passing a dynamic Base URL to run the tests against

You might want to run the tests against the current branch of your repository.

If you need to pass a dynamic base URL, you can use the `test_base_url` input.

```yaml
test_base_url: ${{ steps.deploy.outputs.deployment_url }}
```

NOTE: 
- In the example above, the `steps.deploy.outputs.deployment_url` is a placeholder for the actual deployment URL which will vary depending on the deployment environment.
- The `test_base_url` input is used to set the base URL for the tests. It is used to replace the `{{base_url}}` placeholder in the test suite.
## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `api_key` | API key for authentication | Yes | |
| `test_suite` | Test suite ID to execute | Yes | |
| `test_base_url` | Base URL for the tests (e.g. https://staging.yourdomain.com) | No | |
| `api_base_url` | Base URL for the API | No | `https://verex.ai/api` |
| `max_poll_attempts` | Maximum number of polling attempts | No | `60` |
| `poll_interval_seconds` | Seconds to wait between polling attempts | No | `10` |
| `debug` | Enable debug mode | No | `false` |

## Outputs

| Name | Description |
|------|-------------|
| `test_suite_run_id` | ID of the test suite run |
| `test_suite_run_status` | Status of the test suite run |
| `test_suite_link` | Link to the test suite |
| `test_suite_run_link` | Link to the test suite run |
| `total_tests` | Total number of tests executed |
| `passed_tests` | Number of tests that passed |
| `failed_tests` | Number of tests that failed |
| `test_duration` | Total duration of the test run in seconds |

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
- Non-existent Test Suite ID
- Network connectivity problems
- Timeouts (tweak `poll_interval_seconds` and/or `max_poll_attempts` for longer-running tests)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.