# Workspace Instructions

## SQL Express Authentication

- Authenticate to SQL Express using Windows Integrated Authentication.
- The authorized database identity is the currently logged-in Windows account.
- Do not use, infer, configure, or troubleshoot the Codex sandbox identity as a SQL Server login.
- When sandbox restrictions prevent access under the logged-in Windows identity, request the required elevated execution instead of changing SQL Server users, logins, permissions, or connection credentials.
- Do not add SQL usernames or passwords to connection strings unless the user explicitly requests a change from Windows Integrated Authentication.
