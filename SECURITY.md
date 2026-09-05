# Security Policy

## Scope

FileForge does not use a database, does not store uploaded files, and does not maintain user accounts. Files are processed for the duration of a single conversion request, whether that happens in the browser or on the backend, and are not retained afterward.

This limits the attack surface, but the following are still in scope for a security report:

- Any way to make the backend retain, log, or expose file contents beyond the single request they belong to.
- Any way to bypass file-size limits or the request queue in a way that could crash or exhaust the backend.
- Dependency vulnerabilities in either the frontend or backend that could lead to remote code execution, data exposure, or denial of service.
- Any client-side vulnerability that could expose one user's file to another user, or execute unintended code in the browser.

## Reporting a Vulnerability

Please do not open a public GitHub issue for security vulnerabilities.

Instead, use GitHub's private vulnerability reporting feature on this repository (Security tab → Report a vulnerability). This opens a private advisory that only maintainers can see until it's resolved.

When reporting, please include:

- A description of the vulnerability and its potential impact.
- Steps to reproduce it, or a proof of concept if possible.
- Which service is affected (frontend or backend), and the version or commit if known.

## Response

This is a personal project maintained outside of full-time work, so response times aren't guaranteed on a fixed schedule. Reports will be acknowledged and looked at as soon as reasonably possible, and credit will be given for valid reports unless anonymity is requested.

## Supported Versions

FileForge does not yet have tagged releases. Until it does, only the latest commit on the `main` branch is supported.