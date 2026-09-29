# ============================================================
# TalentFlow AI - VPC Foundation
# Region: eu-north-1
# ============================================================

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  az_a = data.aws_availability_zones.available.names[0]
  az_b = data.aws_availability_zones.available.names[1]

  common_tags = {
    Project     = "TalentFlow-AI"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}

# ------------------------------------------------------------
# VPC
# ------------------------------------------------------------

resource "aws_vpc" "talentflow" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "TalentFlow-VPC"
  })
}

# ------------------------------------------------------------
# Internet Gateway
# ------------------------------------------------------------

resource "aws_internet_gateway" "talentflow" {
  vpc_id = aws_vpc.talentflow.id

  tags = merge(local.common_tags, {
    Name = "TalentFlow-IGW"
  })
}

# ============================================================
# PUBLIC SUBNETS
# ============================================================

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.talentflow.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = local.az_a
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "TalentFlow-Public-A"
    Tier = "Public"
  })
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.talentflow.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = local.az_b
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "TalentFlow-Public-B"
    Tier = "Public"
  })
}

# ============================================================
# PRIVATE APPLICATION SUBNETS
# ============================================================

resource "aws_subnet" "app_a" {
  vpc_id            = aws_vpc.talentflow.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = local.az_a

  tags = merge(local.common_tags, {
    Name = "TalentFlow-App-A"
    Tier = "Private-App"
  })
}

resource "aws_subnet" "app_b" {
  vpc_id            = aws_vpc.talentflow.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = local.az_b

  tags = merge(local.common_tags, {
    Name = "TalentFlow-App-B"
    Tier = "Private-App"
  })
}

# ============================================================
# PRIVATE DATABASE SUBNETS
# ============================================================

resource "aws_subnet" "db_a" {
  vpc_id            = aws_vpc.talentflow.id
  cidr_block        = "10.0.21.0/24"
  availability_zone = local.az_a

  tags = merge(local.common_tags, {
    Name = "TalentFlow-DB-A"
    Tier = "Private-DB"
  })
}

resource "aws_subnet" "db_b" {
  vpc_id            = aws_vpc.talentflow.id
  cidr_block        = "10.0.22.0/24"
  availability_zone = local.az_b

  tags = merge(local.common_tags, {
    Name = "TalentFlow-DB-B"
    Tier = "Private-DB"
  })
}

# ============================================================
# PUBLIC ROUTE TABLE
# ============================================================

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.talentflow.id

  tags = merge(local.common_tags, {
    Name = "TalentFlow-Public-RT"
  })
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.talentflow.id
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# ============================================================
# PRIVATE APPLICATION ROUTE TABLE
# ============================================================

resource "aws_route_table" "app" {
  vpc_id = aws_vpc.talentflow.id

  tags = merge(local.common_tags, {
    Name = "TalentFlow-App-RT"
  })
}

resource "aws_route_table_association" "app_a" {
  subnet_id      = aws_subnet.app_a.id
  route_table_id = aws_route_table.app.id
}

resource "aws_route_table_association" "app_b" {
  subnet_id      = aws_subnet.app_b.id
  route_table_id = aws_route_table.app.id
}

# ============================================================
# PRIVATE DATABASE ROUTE TABLE
# ============================================================

resource "aws_route_table" "db" {
  vpc_id = aws_vpc.talentflow.id

  tags = merge(local.common_tags, {
    Name = "TalentFlow-DB-RT"
  })
}

resource "aws_route_table_association" "db_a" {
  subnet_id      = aws_subnet.db_a.id
  route_table_id = aws_route_table.db.id
}

resource "aws_route_table_association" "db_b" {
  subnet_id      = aws_subnet.db_b.id
  route_table_id = aws_route_table.db.id
}