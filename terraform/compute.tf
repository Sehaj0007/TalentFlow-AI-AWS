# ============================================================
# TalentFlow AI - EC2 Application Server
# Phase 5 - First AWS Deployment
# ============================================================

# ------------------------------------------------------------
# Amazon Linux 2023 AMI
# ------------------------------------------------------------

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["137112412989"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

# ------------------------------------------------------------
# EC2 Instance
# ------------------------------------------------------------

resource "aws_instance" "app" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.app_instance_type

  subnet_id = aws_subnet.public_a.id

  vpc_security_group_ids = [
    aws_security_group.app.id
  ]

  iam_instance_profile = aws_iam_instance_profile.app.name

  associate_public_ip_address = true

  user_data = templatefile("${path.module}/user_data.sh", {
    db_host     = aws_db_instance.talentflow.address
    db_port     = aws_db_instance.talentflow.port
    db_name     = aws_db_instance.talentflow.db_name
    db_username = aws_db_instance.talentflow.username
    db_password = random_password.db.result

    s3_bucket = aws_s3_bucket.talentflow_files.bucket
  })

  user_data_replace_on_change = true

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  tags = merge(local.common_tags, {
    Name = "TalentFlow-App-Server"
    Tier = "Application"
  })
}