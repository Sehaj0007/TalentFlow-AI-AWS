# ============================================================
# TalentFlow AI - Security Groups
# Region: eu-north-1
# ============================================================

# ------------------------------------------------------------
# Application Security Group
#
# This will be used by the future EC2 application servers.
# ------------------------------------------------------------

resource "aws_security_group" "app" {
  name        = "TalentFlow-App-SG"
  description = "Security group for TalentFlow AI application servers"
  vpc_id      = aws_vpc.talentflow.id

  # Outbound traffic is required for the application to reach
  # RDS and other AWS services.
  egress {
    description = "Allow outbound IPv4 traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "TalentFlow-App-SG"
    Tier = "Application"
  })
}

# ------------------------------------------------------------
# Database Security Group
#
# RDS will NOT be exposed directly to the internet.
# PostgreSQL access is allowed only from the application SG.
# ------------------------------------------------------------

resource "aws_security_group" "database" {
  name        = "TalentFlow-DB-SG"
  description = "Security group for TalentFlow AI RDS PostgreSQL"
  vpc_id      = aws_vpc.talentflow.id

  ingress {
    description     = "PostgreSQL access from TalentFlow application servers"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    description = "Allow outbound IPv4 traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "TalentFlow-DB-SG"
    Tier = "Database"
  })
}