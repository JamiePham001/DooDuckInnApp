# About

A business mobile application striving to help my dad become self-sufficient in writing his own GST reports and simplifying ordering stock from suppliers via email. The core of this project focuses on creating a low-friction, highly automated solution for someone who isn't fluent with technology and struggles with using email clients and creating documents in Word independently.

## Key Features

- Sending emails with the touch of a button
- Automated production of PDF documents for GST reports
  - Uses AI workflows to scan key data from invoices and import it directly into the document
- A list of items to order from suppliers
- Triaging emails by importance with an AI workflow cron job
- Vietnamese language localisation

## Tech Stack

- **Frontend:** React Native (Expo)
- **Backend Runtime:** ASP.NET Core (.NET)
- **Compute / Hosting:** AWS Lambda + AWS API Gateway
- **Database:** Neon PostgreSQL
- **ORM / Data Layer:** Entity Framework Core
- **Auth:** AWS Cognito & AWS Amplify
- **File / Blob Storage:** AWS S3
- **Monitoring / APM:** AWS CloudWatch with AWS SNS notifications
- **Transactional Email:** Brevo
- **AI / LLM:** Anthropic SDK with the GLM 5.3 Flash model
- **CI/CD:** GitHub Actions

## What I Learned

**Using .NET/C# and writing an entire codebase around OOP principles**
- Defining tables/entities as classes
- Defining class methods
- Using records and enums

**Generating styled, formatted PDF documents** using the QuestPDF library

**Creating AI workflows**
- Learning to use the right model for the right scenario. For instance, one requirement of this project was a model able to process images with high accuracy.

**React Native / Expo**
- Splash screens
- Swipe actions to delete
- Integrating a camera feature to take photos for image scans
- `useFocusEffect`: running effects whenever a page enters focus — for instance, refetching data on a page that updates often during regular use of the app
- Language localisation
- Caching API calls on low-to-medium-traffic pages that only need refetching when actions on other pages affect them

**AWS**
- Creating CloudWatch alarms to detect and notify me (via SNS) of errors from Lambda functions and API Gateway
- Using a code-to-architecture approach with AWS CloudFormation to build out serverless infrastructure

**GitHub Actions**
- Creating workflows to automate backend and frontend testing whenever commits are pushed to the repository
- Creating a deploy workflow that only triggers when backend changes are pushed to the repository

## What I Can Improve On

**Use a different backend framework or hosting solution entirely.** The breadth and completeness of the official AWS documentation for .NET/C# is lacking, which makes it difficult to self-implement AWS services without heavy AI assistance.

**Use a more popular framework for AI workflows.** .NET seems to lag behind when it comes to having the latest and most powerful, cheap, and fast AI agent SDKs. When researching the strongest and cheapest options for this project's AI workflows, .NET fell short on access to SDKs for the latest Muse Spark, Qwen, Kimi, and Gemini 3.0+ models. I had to resort to "hacky" methods, like swapping the API endpoint behind the Anthropic SDK for a cheaper alternative provider.

**Reduce Lambda cold start times to under a second.** This could be achieved with AWS's SnapStart. I didn't implement it because it adds complexity that doesn't seem worthwhile at the project's current scope — it requires repointing API Gateway to a different Lambda alias, ensuring newly deployed functions point to that alias, and handling stale database connections. Instead, I improved cold starts by increasing Lambda memory and using the arm64 architecture, which is better optimised for .NET.

**Plan the full tech stack earlier.** Since this was my first time using AWS, I underestimated how much Lambda functions and SnapStart could structurally impact my codebase. Going forward, combining personal research with AI planning ahead of time should solve this.

**Make better use of agents in development.** This project was mostly a learning exercise — roughly half the code is hand-written. To improve productivity and my agentic workflows going forward, I'd add more behavioral guidance to `CLAUDE.md` to automate testing after certain actions, use `SKILLS.md` to improve test quality and coverage, and make more use of MCPs/plugins to give agents direct access to my stack and speed up the build process.
