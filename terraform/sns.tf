# ============================================================
# TalentFlow AI - SNS Notifications
# Region: eu-north-1
# ============================================================

resource "aws_sns_topic" "talentflow_events" {
  name = "talentflow-events"

  tags = merge(local.common_tags, {
    Name = "TalentFlow Events"
    Tier = "Messaging"
  })
}