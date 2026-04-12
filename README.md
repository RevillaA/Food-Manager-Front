# EsquinarevisFront

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Docker Local

Run frontend in Docker (served by Nginx on port 4200):

```bash
npm run docker:up
```

Stop containers:

```bash
npm run docker:down
```

Reset containers and volumes:

```bash
npm run docker:reset
```

Set API URL for the containerized frontend with `API_URL`:

```bash
API_URL=http://localhost:3000/api npm run docker:up
```

PowerShell:

```powershell
$env:API_URL = "http://localhost:3000/api"
npm run docker:up
```

Change the published frontend port with `FRONTEND_PORT`:

```bash
FRONTEND_PORT=8080 npm run docker:up
```

## CI/CD (GHCR + Railway)

Workflow file: `.github/workflows/docker-release.yml`

On every push to `main` and tags like `v1.0.0`, the pipeline:

1. Builds Docker image
2. Pushes to `ghcr.io/<owner>/<repo>`
3. Triggers Railway redeploy

Assumption:

- The Railway service already exists and is configured to redeploy from its current source/image using the provided token and service IDs.

Required repository secrets:

- `RAILWAY_TOKEN`
- `RAILWAY_PROJECT_ID`
- `RAILWAY_ENVIRONMENT_ID`
- `RAILWAY_SERVICE_ID`
