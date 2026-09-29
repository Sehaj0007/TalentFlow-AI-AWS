# ============================================================
# TalentFlow AI - Amazon RDS PostgreSQL
# Region: eu-north-1
# ============================================================

# ------------------------------------------------------------
# RDS Subnet Group
#
# Uses the two private database subnets created in vpc.tf.
# ------------------------------------------------------------

resource "aws_db_subnet_group" "talentflow" {
  name = "talentflow-db-subnet-group"

  subnet_ids = [
    aws_subnet.db_a.id,
    aws_subnet.db_b.id
  ]

  tags = merge(local.common_tags, {
    Name = "TalentFlow-DB-Subnet-Group"
    Tier = "Private-DB"
  })
}

# ------------------------------------------------------------
# Database Password
#
# Generated automatically rather than hard-coded in Terraform.
# The value is stored in Terraform state, which is protected by
# the encrypted S3 backend configured in backend.tf.
# ------------------------------------------------------------

resource "random_password" "db" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# ------------------------------------------------------------
# RDS PostgreSQL Instance
# ------------------------------------------------------------

resource "aws_db_instance" "talentflow" {
  identifier = "talentflow-postgres"

  engine = "postgres"

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db.result

  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  max_allocated_storage = 100

  # Private database
  publicly_accessible = false

  # Network
  db_subnet_group_name   = aws_db_subnet_group.talentflow.name
  vpc_security_group_ids = [aws_security_group.database.id]

  # Availability
  multi_az = false

  # Backup
  backup_retention_period = var.db_backup_retention_days
  backup_window           = "03:00-04:00"

  # Maintenance
  maintenance_window = "sun:04:00-sun:05:00"

  # Cost-conscious configuration for this project
  auto_minor_version_upgrade = true
  deletion_protection        = false
  skip_final_snapshot        = true

  # Prevent accidental recreation when Terraform sees
  # an externally managed password change.
  lifecycle {
    ignore_changes = [
      password
    ]
  }

  tags = merge(local.common_tags, {
    Name = "TalentFlow-PostgreSQL"
    Tier = "Database"
  })
}