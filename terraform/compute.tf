# ============================================================
# TalentFlow AI - EC2 Application Server
# Phase 5 - First AWS Deployment
# ============================================================

# ------------------------------------------------------------
# Amazon Linux 2023 AMI
# ------------------------------------------------------------

variable "app_ami_id" {
  description = "Pinned Amazon Linux 2023 AMI for TalentFlow EC2"
  type        = string
  default     = "ami-08bccdfb2ee2afd7a"
}

# ------------------------------------------------------------
# EC2 Instance
# ------------------------------------------------------------

resource "aws_instance" "app" {
  ami           = var.app_ami_id
  instance_type = var.app_instance_type

  subnet_id = aws_subnet.public_a.id

  vpc_security_group_ids = [
    aws_security_group.app.id
  ]

  # Key Pair added for direct SSH access
  key_name = "myKey"

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

  # Prevent forced instance destruction on user_data updates
  user_data_replace_on_change = false

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  # Ignore changes to user_data so future 'terraform apply' calls run in-place
  lifecycle {
    ignore_changes = [
      user_data,
    ]
  }

  tags = merge(local.common_tags, {
    Name = "TalentFlow-App-Server"
    Tier = "Application"
  })
}