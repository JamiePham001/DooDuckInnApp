# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

DooDuckInnApp is a business mobile application intended to help the their father become self-sufficient in:

- writing quarterly GST (Goods and Services Tax) reports
- ordering stock from suppliers via email

Making use of AI Workflows:

- image and form processing
- produce report documents
- quarter summary
- automate emails

## General

- Never push with my explicit permission

## Tech Stack

- Frontend: React Native
- Backend Runtime: ASP.NET Core (.NET)
- Compute / Hosting: AWS Lambda + AWS API Gateway
- Database: Neon PostgreSQL
- ORM / Data Layer: Entity Framework Core
- Auth: AWS Cognito
- File / Blob Storage: AWS S3
- Monitoring / APM: AWS CloudWatch
- Transactional Email: AWS SES
- AI / LLM: Anthropic Claude
- Search: Postgres FTS
- CI / CD: GitHub Actions

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

GST
  gst_id        (PK, NOT_NULL, Integer)
  user_id       (FK, NOT_NULL, Integer)
  start_date    (NOT_NULL, Date)
  end_date      (NOT_NULL, Date, CHECK > start_date)
  UNIQUE(user_id, start_date, end_date)

TRANSACTION
  transaction_id (PK, NOT_NULL, Integer)
  gst_id         (FK, NOT_NULL, Integer)
  name           (NOT_NULL, Varchar(150))
  amount         (NOT_NULL, Double, DEFAULT 0)
  gst            (NOT_NULL, Double)
  type           (NOT_NULL, Integer, CHECK IN (0=Sale, 1=Purchase))
```

Relationships:

- USER has SUPPLIER (one-to-many)
- SUPPLIER supplies ITEM (one-to-many)
- USER has GST (one-to-many)
- GST records TRANSACTION (one-to-many)

Note: TRANSACTION replaces the earlier separate SALES/PURCHASE tables — a single table
distinguished by `type`. ITEM and SUPPLIER are not yet linked to TRANSACTION.
