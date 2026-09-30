# ============================================================
# TalentFlow AI - Terraform Outputs
# ============================================================

# ------------------------------------------------------------
# VPC
# ------------------------------------------------------------

output "vpc_id" {
  description = "TalentFlow VPC ID"
  value       = aws_vpc.talentflow.id
}

output "availability_zones" {
  description = "Availability zones used by TalentFlow"
  value = [
    local.az_a,
    local.az_b
  ]
}

# ------------------------------------------------------------
# Subnets
# ------------------------------------------------------------

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value = [
    aws_subnet.public_a.id,
    aws_subnet.public_b.id
  ]
}

output "app_subnet_ids" {
  description = "Private application subnet IDs"
  value = [
    aws_subnet.app_a.id,
    aws_subnet.app_b.id
  ]
}

output "db_subnet_ids" {
  description = "Private database subnet IDs"
  value = [
    aws_subnet.db_a.id,
    aws_subnet.db_b.id
  ]
}

# ------------------------------------------------------------
# Security Groups
# ------------------------------------------------------------

output "app_security_group_id" {
  description = "Security group ID for TalentFlow application servers"
  value       = aws_security_group.app.id
}

output "database_security_group_id" {
  description = "Security group ID for TalentFlow RDS"
  value       = aws_security_group.database.id
}

# ------------------------------------------------------------
# RDS
# ------------------------------------------------------------

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.talentflow.address
}

output "rds_port" {
  description = "RDS PostgreSQL port"
  value       = aws_db_instance.talentflow.port
}

output "rds_database_name" {
  description = "TalentFlow PostgreSQL database name"
  value       = aws_db_instance.talentflow.db_name
}

# ------------------------------------------------------------
# S3
# ------------------------------------------------------------

output "s3_bucket_name" {
  description = "TalentFlow recruitment file storage bucket"
  value       = aws_s3_bucket.talentflow_files.id
}

output "s3_bucket_arn" {
  description = "ARN of the TalentFlow recruitment file bucket"
  value       = aws_s3_bucket.talentflow_files.arn
}

output "app_instance_id" {
  description = "TalentFlow application EC2 instance ID"
  value       = aws_instance.app.id
}

output "app_instance_public_ip" {
  description = "Public IP of the TalentFlow application EC2 instance"
  value       = aws_instance.app.public_ip
}

output "app_instance_public_dns" {
  description = "Public DNS of the TalentFlow application EC2 instance"
  value       = aws_instance.app.public_dns
}