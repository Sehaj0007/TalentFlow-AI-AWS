# ============================================================
# TalentFlow AI - SQS Resume Processing
# Region: eu-north-1
# ============================================================

# ------------------------------------------------------------
# Dead Letter Queue
# ------------------------------------------------------------

resource "aws_sqs_queue" "resume_processing_dlq" {
  name = "talentflow-resume-processing-dlq"

  message_retention_seconds = 1209600 # 14 days

  sqs_managed_sse_enabled = true

  tags = merge(local.common_tags, {
    Name = "TalentFlow Resume Processing DLQ"
    Tier = "Messaging"
  })
}

# ------------------------------------------------------------
# Main Resume Processing Queue
# ------------------------------------------------------------

resource "aws_sqs_queue" "resume_processing" {
  name = "talentflow-resume-processing"

  # Lambda timeout = 60 seconds.
  # Queue visibility is deliberately much longer so a failed
  # Lambda invocation is not immediately delivered again.
  visibility_timeout_seconds = 360

  message_retention_seconds = 345600 # 4 days

  sqs_managed_sse_enabled = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.resume_processing_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(local.common_tags, {
    Name = "TalentFlow Resume Processing Queue"
    Tier = "Messaging"
  })
}

# ------------------------------------------------------------
# Allow S3 to publish ObjectCreated notifications to SQS
# ------------------------------------------------------------

data "aws_caller_identity" "current" {}

resource "aws_sqs_queue_policy" "resume_processing" {
  queue_url = aws_sqs_queue.resume_processing.id

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Sid    = "AllowS3ToSendResumeEvents"
        Effect = "Allow"

        Principal = {
          Service = "s3.amazonaws.com"
        }

        Action   = "sqs:SendMessage"
        Resource = aws_sqs_queue.resume_processing.arn

        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_s3_bucket.talentflow_files.arn
          }

          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}