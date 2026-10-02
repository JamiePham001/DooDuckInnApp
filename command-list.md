Frontend (run from `frontend/`):

- start dev server: `npx expo start`
- run on Android device/emulator: `npx expo run:android`
- run on iOS simulator: `npx expo run:ios`
- rebuild native projects after changing app.json/plugins: `npx expo prebuild --clean`
- lint: `npx expo lint`
- test: `npm test` / watch mode: `npm run test:watch` / coverage: `npm run test:coverage`

EAS (build & submit, run from `frontend/`):

- build iOS production: `eas build --platform ios --profile production`
- build Android production: `eas build --platform android --profile production`
- build internal/preview (for testing on a device without the store): `eas build --platform ios --profile preview`
- submit latest build to App Store Connect: `eas submit --platform ios --latest`
- submit latest build to Play Console: `eas submit --platform android --latest`
- check build status: `eas build:list --limit 5`

Backend (run from `backend/DooDuckInn/`):

- build: `dotnet build`
- run locally: `dotnet run` or with hot reload: `dotnet watch run`
- run tests: `dotnet test` (from `backend/`, runs `DooDuckInn.Tests`)
- set a local dev secret (never put these in appsettings.json): `dotnet user-secrets set "Ses:SmtpPassword" "..."`
- list current user-secrets: `dotnet user-secrets list`

Database (EF Core, run from `backend/DooDuckInn/`):

- add a migration after changing entities: `dotnet ef migrations add <Name>`
- apply migrations to the configured database: `dotnet ef database update`
- revert to a specific prior migration: `dotnet ef database update <PreviousMigrationName>`
- remove the last (unapplied) migration: `dotnet ef migrations remove`

Deploy (SAM/Lambda, run from `backend/DooDuckInn/` or `backend/DooDuckInn.DigestScanFunction/`):

- deploy the API stack: `dotnet lambda deploy-serverless --stack-name dooduckinn-api`
- deploy the digest-scan stack (deploy the API stack first — it owns the shared SSM parameters): `dotnet lambda deploy-serverless --stack-name dooduckinn-digest-scan`
- tail Lambda logs: `aws logs tail /aws/lambda/dooduckinnapi --follow`

Git:

- see what's changed: `git status`
- see staged+unstaged diff: `git diff`
- create a feature branch: `git checkout -b <branch-name>`
