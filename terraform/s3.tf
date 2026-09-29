# ============================================================
# TalentFlow AI - Amazon S3 Recruitment File Storage
# Region: eu-north-1
# ============================================================

# ------------------------------------------------------------
# S3 Bucket
#
# Used for:
#   resumes/
#   documents/
#   generated/
#   static/
# ------------------------------------------------------------

resource "aws_s3_bucket" "talentflow_files" {
  bucket_prefix = "talentflow-ai-files-"

  tags = merge(local.common_tags, {
    Name = "TalentFlow Recruitment Files"
    Tier = "Storage"
  })
}

# ------------------------------------------------------------
# Block all public access
# ------------------------------------------------------------

resource "aws_s3_bucket_public_access_block" "talentflow_files" {
  bucket = aws_s3_bucket.talentflow_files.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ------------------------------------------------------------
# Server-side encryption
# ------------------------------------------------------------

resource "aws_s3_bucket_server_side_encryption_configuration" "talentflow_files" {
  bucket = aws_s3_bucket.talentflow_files.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }

    bucket_key_enabled = true
  }
}

# ------------------------------------------------------------
# Versioning
# ------------------------------------------------------------

resource "aws_s3_bucket_versioning" "talentflow_files" {
  bucket = aws_s3_bucket.talentflow_files.id

  versioning_configuration {
    status = "Enabled"
  }
}

# ------------------------------------------------------------
# Lifecycle Management
#
# Old object versions are eventually cleaned up to prevent
# unnecessary storage growth.
# ------------------------------------------------------------

resource "aws_s3_bucket_lifecycle_configuration" "talentflow_files" {
  bucket = aws_s3_bucket.talentflow_files.id

  rule {
    id     = "cleanup-old-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# ------------------------------------------------------------
# S3 Folder Prefixes
#
# S3 does not have real folders. These objects establish the
# intended logical structure.
# ------------------------------------------------------------

resource "aws_s3_object" "resumes_prefix" {
  bucket  = aws_s3_bucket.talentflow_files.id
  key     = "resumes/"
  content = ""
}

resource "aws_s3_object" "documents_prefix" {
  bucket  = aws_s3_bucket.talentflow_files.id
  key     = "documents/"
  content = ""
}

resource "aws_s3_object" "generated_prefix" {
  bucket  = aws_s3_bucket.talentflow_files.id
  key     = "generated/"
  content = ""
}

resource "aws_s3_object" "static_prefix" {
  bucket  = aws_s3_bucket.talentflow_files.id
  key     = "static/"
  content = ""
}