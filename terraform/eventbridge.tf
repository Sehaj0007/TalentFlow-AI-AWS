# ============================================================
# TalentFlow AI - EventBridge
# Region: eu-north-1
# ============================================================

# ------------------------------------------------------------
# Custom Event Bus
# ------------------------------------------------------------

resource "aws_cloudwatch_event_bus" "talentflow" {
  name = "talentflow-event-bus"

  tags = merge(local.common_tags, {
    Name = "TalentFlow Event Bus"
    Tier = "Integration"
  })
}

# ------------------------------------------------------------
# Candidate Shortlisted Rule
# ------------------------------------------------------------

resource "aws_cloudwatch_event_rule" "candidate_shortlisted" {
  name           = "talentflow-candidate-shortlisted"
  description    = "Routes CANDIDATE_SHORTLISTED events to SNS"
  event_bus_name = aws_cloudwatch_event_bus.talentflow.name

  event_pattern = jsonencode({
    source      = ["talentflow.application"]
    detail-type = ["CANDIDATE_SHORTLISTED"]
  })

  tags = merge(local.common_tags, {
    Name = "TalentFlow Candidate Shortlisted Rule"
    Tier = "Integration"
  })
}

# ------------------------------------------------------------
# EventBridge -> SNS Target
# ------------------------------------------------------------

resource "aws_cloudwatch_event_target" "candidate_shortlisted_sns" {
  rule           = aws_cloudwatch_event_rule.candidate_shortlisted.name
  event_bus_name = aws_cloudwatch_event_bus.talentflow.name
  target_id      = "TalentFlowSNS"
  arn            = aws_sns_topic.talentflow_events.arn
}

# ------------------------------------------------------------
# Allow EventBridge to publish to SNS
# ------------------------------------------------------------

resource "aws_sns_topic_policy" "allow_eventbridge" {
  arn = aws_sns_topic.talentflow_events.arn

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Sid    = "AllowEventBridgePublish"
        Effect = "Allow"

        Principal = {
          Service = "events.amazonaws.com"
        }

        Action = "sns:Publish"

        Resource = aws_sns_topic.talentflow_events.arn

        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_cloudwatch_event_rule.candidate_shortlisted.arn
          }
        }
      }
    ]
  })
}