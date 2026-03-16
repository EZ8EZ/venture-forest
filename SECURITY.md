# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly. **Do not open a public issue.**

Instead, email the maintainers at: **security@example.com** (replace with your actual contact)

Please include:

- A description of the vulnerability
- Steps to reproduce the issue
- The potential impact
- Any suggested fixes, if applicable

## Response Timeline

- **Acknowledgement:** within 48 hours of your report
- **Initial assessment:** within 5 business days
- **Resolution target:** within 30 days, depending on severity

## Supported Versions

| Version | Supported |
| ------- | --------- |
| latest  | Yes       |

## Disclosure Policy

We follow coordinated disclosure. Once a fix is available, we will publish an advisory and credit the reporter (unless anonymity is requested).

## Best Practices

- Never commit secrets, API keys, or credentials to the repository.
- Use environment variables for all sensitive configuration (see `.env.example`).
- Keep dependencies up to date and review security advisories regularly.
