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
# Systems Manager (SSM) Session Manager Access
# ------------------------------------------------------------

resource "aws_iam_role_policy_attachment" "ssm_policy" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
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

# ============================================================
# Lambda - Resume Processor IAM Role
# ============================================================

resource "aws_iam_role" "resume_processor" {
  name = "TalentFlow-Lambda-ResumeProcessor-Role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Service = "lambda.amazonaws.com"
        }

        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "TalentFlow-Lambda-ResumeProcessor-Role"
    Tier = "Application"
  })
}

# ------------------------------------------------------------
# Required permissions for VPC-enabled Lambda
# ------------------------------------------------------------

resource "aws_iam_role_policy_attachment" "resume_processor_vpc" {
  role       = aws_iam_role.resume_processor.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# ------------------------------------------------------------
# Resume Processor permissions
# ------------------------------------------------------------

resource "aws_iam_role_policy" "resume_processor" {
  name = "TalentFlow-Lambda-ResumeProcessor-Policy"
  role = aws_iam_role.resume_processor.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [

      # ------------------------------------------------------
      # S3 - Read uploaded resumes
      # ------------------------------------------------------

      {
        Effect = "Allow"

        Action = [
          "s3:GetObject",
          "s3:HeadObject"
        ]

        Resource = "${aws_s3_bucket.talentflow_files.arn}/resumes/*"
      },

      # ------------------------------------------------------
      # SQS - Consume resume processing messages
      # ------------------------------------------------------

      {
        Effect = "Allow"

        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]

        Resource = aws_sqs_queue.resume_processing.arn
      },

      # ------------------------------------------------------
      # CloudWatch Logs
      # ------------------------------------------------------

      {
        Effect = "Allow"

        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]

        Resource = "${aws_cloudwatch_log_group.resume_processor.arn}:*"
      }
    ]
  })
}