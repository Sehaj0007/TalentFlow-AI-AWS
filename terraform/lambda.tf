# ============================================================
# TalentFlow AI - Resume Processing Lambda
# Region: eu-north-1
# ============================================================

# ------------------------------------------------------------
# CloudWatch Log Group
# ------------------------------------------------------------

resource "aws_cloudwatch_log_group" "resume_processor" {
  name              = "/aws/lambda/talentflow-resume-processor"
  retention_in_days = 14

  tags = merge(local.common_tags, {
    Name = "TalentFlow Resume Processor Logs"
    Tier = "Monitoring"
  })
}

# ------------------------------------------------------------
# Lambda Function
# ------------------------------------------------------------

data "archive_file" "resume_processor" {
  type = "zip"

  source_dir = "${path.module}/lambda/resume_processor"

  output_path = "${path.module}/resume_processor.zip"

  excludes = [
    "*.log",
    ".DS_Store"
  ]
}

resource "aws_lambda_function" "resume_processor" {
  function_name = "TalentFlow-Resume-Processor"

  description = "Processes uploaded TalentFlow AI resumes from SQS"

  role = aws_iam_role.resume_processor.arn

  handler = "index.handler"

  runtime = "nodejs22.x"

  filename = data.archive_file.resume_processor.output_path

  source_code_hash = data.archive_file.resume_processor.output_base64sha256

  timeout     = 60
  memory_size = 256

  architectures = [
    "x86_64"
  ]

  environment {
    variables = {
      S3_BUCKET = aws_s3_bucket.talentflow_files.bucket

      DB_HOST = aws_db_instance.talentflow.address
      DB_PORT = tostring(aws_db_instance.talentflow.port)

      DB_NAME = var.db_name
      DB_USER = var.db_username

      DB_PASSWORD = random_password.db.result
    }
  }

  vpc_config {
    subnet_ids = [
      aws_subnet.app_a.id,
      aws_subnet.app_b.id
    ]

    security_group_ids = [
      aws_security_group.lambda.id
    ]
  }

  depends_on = [
    aws_cloudwatch_log_group.resume_processor,
    aws_iam_role_policy.resume_processor,
    aws_iam_role_policy_attachment.resume_processor_vpc
  ]

  tags = merge(local.common_tags, {
    Name = "TalentFlow-Resume-Processor"
    Tier = "Application"
  })
}

# ------------------------------------------------------------
# SQS -> Lambda Event Source Mapping
# ------------------------------------------------------------

resource "aws_lambda_event_source_mapping" "resume_processing" {
  event_source_arn = aws_sqs_queue.resume_processing.arn

  function_name = aws_lambda_function.resume_processor.arn

  batch_size                         = 5
  maximum_batching_window_in_seconds = 5

  enabled = true

  function_response_types = [
    "ReportBatchItemFailures"
  ]
}