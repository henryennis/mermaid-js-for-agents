Create a Mermaid sequence diagram for this login flow:

- Browser sends credentials to WebApp.
- WebApp asks AuthService to verify the credentials.
- AuthService checks UserStore.
- If credentials are valid, AuthService returns a session token and WebApp returns a dashboard
  response.
- If credentials are invalid, AuthService returns a failure and WebApp returns an error response.

Use Mermaid sequence diagram syntax with an `alt` branch. Include one concise sentence explaining
why a sequence diagram fits.
