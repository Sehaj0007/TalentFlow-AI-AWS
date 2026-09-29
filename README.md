# TalentFlow AI

**AI-Powered Recruitment & Talent Management Platform**

TalentFlow AI is a web-based recruitment and talent management platform designed to streamline candidate management, job applications, resume handling, screening, interviews and recruitment workflows.

The project combines a lightweight web frontend with a Node.js/Express backend, PostgreSQL data persistence and Terraform-managed AWS infrastructure.

---

## Overview

TalentFlow AI provides a centralised workspace for managing recruitment activities across the candidate lifecycle.

### Core capabilities

* 🔐 User authentication
* 👤 Candidate management
* 💼 Job management
* 📄 Resume upload and management
* 📋 Job applications
* 🧠 Candidate screening and evaluation
* 📅 Interview management
* 📊 Candidate status tracking
* 🔔 Recruitment workflow support
* ☁️ AWS-ready infrastructure managed with Terraform

---

## Architecture

```text
                    ┌──────────────────────┐
                    │      TalentFlow AI   │
                    │      Web Frontend    │
                    │   HTML / CSS / JS    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    Node.js + Express │
                    │       Backend        │
                    └──────────┬───────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
              ▼                                 ▼
       ┌───────────────┐                 ┌───────────────┐
       │  PostgreSQL   │                 │  Application  │
       │    Database   │                 │    Services   │
       └───────────────┘                 └───────────────┘

                         AWS Infrastructure
                               │
                               ▼
                       ┌──────────────┐
                       │   Terraform  │
                       └──────┬───────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
           VPC /          EC2 / Compute      RDS
         Networking                         PostgreSQL
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
             S3                             IAM
          Storage                         Security
```

The broader AWS architecture is designed around the principle of separating application, compute, database, storage, security and infrastructure-management concerns.

---

## Technology Stack

| Layer           | Technologies                          |
| --------------- | ------------------------------------- |
| Frontend        | HTML5, CSS3, JavaScript               |
| Backend         | Node.js, Express.js                   |
| Database        | PostgreSQL                            |
| Authentication  | Environment-based demo authentication |
| Infrastructure  | Terraform                             |
| Cloud Platform  | Amazon Web Services (AWS)             |
| AWS Services    | VPC, EC2, RDS, S3, IAM                |
| Version Control | Git, GitHub                           |

---

## Project Structure

```text
TalentFlow-AI/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── 1.png
│   └── 2.png
│
├── backend/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── applicationsController.js
│   │   ├── authController.js
│   │   ├── candidatesController.js
│   │   ├── interviewsController.js
│   │   ├── jobsController.js
│   │   ├── resumesController.js
│   │   └── screeningController.js
│   │
│   ├── models/
│   │   ├── schema.sql
│   │   └── seed.js
│   │
│   ├── routes/
│   │   ├── applications.js
│   │   ├── auth.js
│   │   ├── candidates.js
│   │   ├── interviews.js
│   │   ├── jobs.js
│   │   ├── resumes.js
│   │   └── screening.js
│   │
│   ├── services/
│   │   ├── candidatesService.js
│   │   ├── jobsService.js
│   │   └── screeningService.js
│   │
│   └── server.js
│
├── terraform/
│   ├── backend.tf
│   ├── compute.tf
│   ├── iam.tf
│   ├── main.tf
│   ├── outputs.tf
│   ├── providers.tf
│   ├── rds.tf
│   ├── s3.tf
│   ├── security.tf
│   ├── user_data.sh
│   ├── variables.tf
│   ├── versions.tf
│   └── vpc.tf
│
├── .gitignore
├── package-lock.json
└── README.md
```

---

## Local Setup

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* PostgreSQL
* Git
* Terraform (required only for AWS infrastructure deployment)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/TalentFlow-AI.git
cd TalentFlow-AI
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create:

```text
backend/.env
```

Configure the required database and application environment variables.

Example structure:

```env
PORT=3010

PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=<your-database-password>
PGDATABASE=<your-database-name>

DEMO_ADMIN_EMAIL=<your-demo-email>
DEMO_ADMIN_PASSWORD=<your-demo-password>
DEMO_AUTH_TOKEN=<your-demo-token>
```

> **Never commit `.env` files, passwords, API keys or other secrets to Git.**

### 4. Configure the database

Create the PostgreSQL database and apply the schema located at:

```text
backend/models/schema.sql
```

The seed script can be used to initialise demo data where required.

### 5. Start the backend

```bash
npm start
```

The backend runs on the configured port, with `3010` used as the default application port.

### 6. Open the application

The Express server serves the frontend application.

Open the application in your browser using the configured local server address.

---

## AWS Infrastructure

The project includes a Terraform configuration for managing the AWS infrastructure.

The current Terraform configuration is organised into separate files for:

* VPC and networking
* Security groups
* EC2 compute
* RDS PostgreSQL
* S3 storage
* IAM
* Variables and outputs
* Provider configuration
* EC2 user-data configuration

### Terraform workflow

```bash
cd terraform

terraform init
terraform fmt
terraform validate
terraform plan
terraform apply
```

To remove the infrastructure when it is no longer required:

```bash
terraform destroy
```

> Review the Terraform plan carefully before applying changes, particularly when working with AWS resources that may incur charges.

---

## Security

Security considerations included in the project include:

* Environment variables for sensitive configuration
* No hard-coded database passwords
* No hard-coded AWS access keys
* `.env` excluded through `.gitignore`
* AWS IAM-based access control
* Security groups for network access control
* Private database architecture where applicable
* Controlled S3 access

The project implementation plan specifically identifies least-privilege IAM, MFA, no hard-coded secrets, private RDS and S3 public-access blocking as security requirements.

---

## AWS Architecture Roadmap

The project is designed to evolve from a locally functional recruitment application towards a production-style AWS architecture.

The planned architecture includes:

```text
User
 │
 ▼
CloudFront / Route 53
 │
 ▼
Application Load Balancer
 │
 ▼
Auto Scaling Group
 │
 ├── EC2
 └── EC2
 │
 ├── RDS PostgreSQL
 └── S3
      │
      ▼
     SQS
      │
      ▼
    Lambda
```

Additional event-driven components include EventBridge, SNS and selected API Gateway/Lambda integrations. Observability is planned through CloudWatch, while Terraform serves as the infrastructure-as-code layer.

---

## Development Focus

This project demonstrates practical experience with:

* Full-stack web application development
* REST API development
* PostgreSQL database integration
* Backend service organisation
* AWS cloud infrastructure
* Infrastructure as Code with Terraform
* Cloud networking
* Compute and database provisioning
* IAM and security controls
* Application deployment concepts
* Cloud cost awareness

---

## Project Status

**Current stage:** Functional application + AWS infrastructure implementation

The application currently focuses on the core recruitment workflow and Terraform-managed AWS infrastructure. Additional AWS capabilities can be integrated progressively as the platform evolves.

---

## Security Notice

This repository is intended for development and demonstration purposes.

Do not commit:

* `.env` files
* AWS access keys
* Database passwords
* API tokens
* Private keys
* Candidate personal data
* Uploaded resumes or other sensitive recruitment documents

Use environment variables or an appropriate secrets-management solution for sensitive configuration.

---

## Author

**Sehajpreet Kaur**

Cloud & DevOps | AWS | Terraform | Node.js | PostgreSQL

---

## License

This project is intended for educational, portfolio and demonstration purposes.
