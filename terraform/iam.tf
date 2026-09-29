# ============================================================
# TalentFlow AI - IAM for EC2 Application
# ============================================================

resource "aws_iam_role" "app" {
  name = "TalentFlow-EC2-App-Role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "ec2.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "TalentFlow-EC2-App-Role"
    Tier = "Application"
  })
}

# ------------------------------------------------------------
# S3 access for application
# ------------------------------------------------------------

resource "aws_iam_role_policy" "app_s3" {
  name = "TalentFlow-App-S3-Access"
  role = aws_iam_role.app.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]

        Resource = "${aws_s3_bucket.talentflow_files.arn}/*"
      },
      {
        Effect = "Allow"

        Action = [
          "s3:ListBucket"
        ]

        Resource = aws_s3_bucket.talentflow_files.arn
      }
    ]
  })
}

# ------------------------------------------------------------
# CloudWatch Logs
# ------------------------------------------------------------

resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# ------------------------------------------------------------
# EC2 Instance Profile
# ------------------------------------------------------------

resource "aws_iam_instance_profile" "app" {
  name = "TalentFlow-EC2-App-Profile"
  role = aws_iam_role.app.name

  tags = merge(local.common_tags, {
    Name = "TalentFlow-EC2-App-Profile"
  })
}