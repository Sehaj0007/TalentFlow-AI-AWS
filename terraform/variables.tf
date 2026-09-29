# ============================================================
# TalentFlow AI - Terraform Variables
# Region: eu-north-1
# ============================================================

variable "aws_region" {
  description = "AWS region for TalentFlow AI infrastructure"
  type        = string
  default     = "eu-north-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "TalentFlow-AI"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

# ============================================================
# RDS
# ============================================================

variable "db_name" {
  description = "TalentFlow PostgreSQL database name"
  type        = string
  default     = "talentflow"
}

variable "db_username" {
  description = "Master username for the TalentFlow PostgreSQL database"
  type        = string
  default     = "talentflow_admin"
}

variable "db_instance_class" {
  description = "RDS PostgreSQL instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Initial RDS storage in GB"
  type        = number
  default     = 20
}

variable "db_backup_retention_days" {
  description = "Number of days to retain automated RDS backups"
  type        = number
  default     = 1
}