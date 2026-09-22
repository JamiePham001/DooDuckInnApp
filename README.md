# About

A business mobile application striving to help my dad become self sufficient in writing his own GST reports and simplifying ordering stock from suppliers via email. Creating a personalised experience that focuses on intuitive navigation and UI using his native Vietnamese language. The app will make use of Claude AI workflows to scan invoices, and automate producing documents and emails.

## Objectives

1.

## Tech Stack

- Frontend: React Native Expo
- Backend Runtime: ASP.NET Core (.NET)
- Compute / Hosting: AWS Lambda + AWS API Gateway
- Database: Neon PostgreSQL
- ORM / Data Layer: Entity Framework Core
- Auth: AWS Cognito
- File / Blob Storage: AWS S3
- Monitoring / APM: AWS CloudWatch
- Transactional Email: AWS SES
- AI / LLM: Anthropic SDK with GLM5.3 Flash model
- Search: Postgres FTS
- CI / CD: GitHub Actions

## What I Learned

- Writing competely OOP code
  - Defining tables/entities as classes
  - defining class methods
  - usage of records and enums
- Configuring JWT bearer authentication with .NET
- Validating tokens from and connecting to AWS Cognito
- Generating stylised and professional PDF documents using QuestPDF library
- Connecting to verified identities in AWS SES via SMTP to write custom automated emails and send documents.
- Create AI Workflows with GLM5.3 Flash using Anthropic SDK
  - optimising cost by taking into consideration the complexity of the task, changing the type of model, applying a cap on token usage, and concise instructions
  - formatting output configuration from AI response
  - embedding dynamic parameters into instructions
  - processing image requests with AI workflows into useable and interactable data.
- React Native / Expo
  - splash screens
  - swipe actions
  - camera feature and retrieving image data
  - useFocusEffect

## What I Can Improve On

## Relational Model

```
USER
  user_id       (PK, NOT_NULL, Integer)
  cognito_sub   (NOT_NULL, UNIQUE, Varchar(150))
  email         (NOT_NULL, Varchar(150))

SUPPLIER
  supplier_id   (PK, NOT_NULL, Integer)
  user_id       (FK, NOT_NULL, Integer)
  name          (NULL, Varchar(150))
  email         (NULL, Varchar(100))
  phone         (NULL, Varchar(15))

ITEM
  item_id       (PK, NOT_NULL, Integer)
  supplier_id   (FK, NOT_NULL, Integer)
  name          (NOT_NULL, Varchar(150))
  quantity      (NOT_NULL, Integer, DEFAULT 0, CHECK >= 0)

TAX
  tax_id        (PK, NOT_NULL, Integer)
  user_id       (FK, NOT_NULL, Integer)
  start_date    (NOT_NULL, Date)
  end_date      (NOT_NULL, Date, CHECK > start_date)
  is_sent       (NOT_NULL, Boolean, DEFAULT false)
  UNIQUE(user_id, start_date, end_date)

TRANSACTION
  transaction_id (PK, NOT_NULL, Integer)
  tax_id         (FK, NOT_NULL, Integer)
  name           (NOT_NULL, Varchar(150))
  amount         (NOT_NULL, Double, DEFAULT 0)
  gst            (NOT_NULL, Double)
  type           (NOT_NULL, Integer, CHECK IN (0=Sale, 1=Purchase))
```

React Native Components
